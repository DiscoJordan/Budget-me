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

const updateAccount = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { transactionId } = req.body as { transactionId: string };
    const transaction = await Transactions.findById({ _id: transactionId });

    if (transaction) {
      const result = await Transactions.findOneAndUpdate(
        { _id: transactionId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      res.status(200).send({
        ok: true,
        data: `Transaction was updated`,
        result,
      });
    } else {
      res.status(200).send({
        ok: true,
        data: `Transaction was not found `,
      });
    }
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

export {
  addTransaction,
  getAllTransactions,
  getTransaction,
  deleteTransaction,
  updateAccount,
};
