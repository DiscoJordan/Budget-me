import Transactions from "../models/transactions";
import Accounts from "../models/accounts";
import { Response } from "express";
import { AuthRequest } from "../src/types";

const addTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      ownerId,
      senderId,
      recipientId,
      icon,
      name,
      subcategory,
      amount,
      currency,
      rate,
      time,
      comment,
    } = req.body as {
      ownerId: string;
      senderId: string;
      recipientId: string;
      icon: { color: string; icon_value: string };
      name?: string;
      subcategory?: string;
      amount: number;
      currency?: string;
      rate?: number;
      time?: string;
      comment?: string;
    };
    const newTransaction = await Transactions.create({
      ownerId,
      senderId,
      recipientId,
      icon,
      name,
      subcategory,
      amount,
      currency,
      rate: rate ?? 1,
      time,
      comment,
    });
    res.send({ ok: true, data: `Transaction was created`, newTransaction });
  } catch (error) {
    const err = error as Error;
    res.send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const deleteTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { transactionId } = req.body as { transactionId: string };
    const transactionExist = await Transactions.findById({
      _id: transactionId,
    });
    if (transactionExist) {
      const { ownerId, senderId, recipientId } = transactionExist;
      await transactionExist.deleteOne();

      const affectedIds = [senderId, recipientId];
      for (const accountId of affectedIds) {
        const account = await Accounts.findById(accountId);
        if (!account) continue;
        const incomeTransactions = await Transactions.find({
          ownerId,
          recipientId: accountId,
        });
        const expenseTransactions = await Transactions.find({
          ownerId,
          senderId: accountId,
        });
        const incomeAmount = incomeTransactions.reduce(
          (acc, t) => acc + t.amount,
          0
        );
        const expenseAmount = expenseTransactions.reduce(
          (acc, t) => acc + t.amount,
          0
        );
        account.balance = account.initialBalance + incomeAmount - expenseAmount;
        if (account.type === "income") account.balance *= -1;
        account.balance = Math.round(account.balance * 100) / 100;
        await account.save();
      }

      res.send({
        ok: true,
        data: `Transaction was deleted`,
      });
    } else {
      res.send({ ok: true, data: `Transaction was not found` });
    }
  } catch (error) {
    const err = error as Error;
    res.send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const recalcBalance = async (accountId: string, ownerId: string): Promise<void> => {
  const account = await Accounts.findById(accountId);
  if (!account) return;
  const incomeTransactions = await Transactions.find({ ownerId, recipientId: accountId });
  const expenseTransactions = await Transactions.find({ ownerId, senderId: accountId });
  const incomeAmount = incomeTransactions.reduce((acc, t) => acc + t.amount * t.rate, 0);
  const expenseAmount = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  account.balance = account.initialBalance + incomeAmount - expenseAmount;
  if (account.type === "income") account.balance *= -1;
  account.balance = Math.round(account.balance * 100) / 100;
  await account.save();
};

const updateTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { transactionId, senderId, recipientId, amount, rate, time, comment, subcategory, icon, currency } =
      req.body as {
        transactionId: string;
        senderId?: string;
        recipientId?: string;
        amount?: number;
        rate?: number;
        time?: string;
        comment?: string;
        subcategory?: string;
        icon?: { color: string; icon_value: string };
        currency?: string;
      };

    const transaction = await Transactions.findById(transactionId);
    if (!transaction) {
      res.status(404).send({ ok: false, data: "Transaction was not found" });
      return;
    }

    const oldSenderId = transaction.senderId.toString();
    const oldRecipientId = transaction.recipientId.toString();

    const updateFields: Record<string, unknown> = {};
    if (senderId !== undefined) updateFields.senderId = senderId;
    if (recipientId !== undefined) updateFields.recipientId = recipientId;
    if (amount !== undefined) updateFields.amount = amount;
    if (rate !== undefined) updateFields.rate = rate;
    if (time !== undefined) updateFields.time = time;
    if (comment !== undefined) updateFields.comment = comment;
    if (subcategory !== undefined) updateFields.subcategory = subcategory;
    if (icon !== undefined) updateFields.icon = icon;
    if (currency !== undefined) updateFields.currency = currency;

    const result = await Transactions.findOneAndUpdate(
      { _id: transactionId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    const ownerId = transaction.ownerId.toString();
    const affectedIds = new Set([oldSenderId, oldRecipientId, senderId, recipientId].filter(Boolean) as string[]);
    for (const id of affectedIds) {
      await recalcBalance(id, ownerId);
    }

    res.status(200).send({ ok: true, data: "Transaction was updated", result });
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const getTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transactions.findById({
      _id: transactionId,
    }).populate(["ownerId", "senderId", "recipientId"]);

    if (transaction) {
      res.status(200).send({ ok: true, data: transaction });
    } else {
      res.status(200).send({ ok: true, data: `Transaction was not found` });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const getAllTransactions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const ownerId = req.params.id;
  try {
    let transactions = await Transactions.find({ ownerId }).populate([
      "ownerId",
      "senderId",
      "recipientId",
    ]);
    const transactionsJson = JSON.parse(JSON.stringify(transactions));
    if (transactionsJson) {
      res.status(200).send({ ok: true, data: transactionsJson });
    } else {
      res.status(200).send({ ok: true, data: `Transactions was not found ` });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const deleteAllTransactions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { ownerId } = req.body as { ownerId: string };
    if (!ownerId) {
      res.status(400).send({ ok: false, data: "ownerId is required" });
      return;
    }

    await Transactions.deleteMany({ ownerId });

    // Reset all account balances to initialBalance
    const accounts = await Accounts.find({ ownerId });
    for (const account of accounts) {
      account.balance = account.type === "income"
        ? 0
        : account.initialBalance ?? 0;
      await account.save();
    }

    res.status(200).send({ ok: true, data: "All transactions deleted" });
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
  }
};

export {
  addTransaction,
  getAllTransactions,
  getTransaction,
  deleteTransaction,
  updateTransaction,
  deleteAllTransactions,
};
