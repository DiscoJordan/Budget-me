import mongoose from "mongoose";
import Accounts from "../models/accounts";
import Transactions from "../models/transactions";
import { Response } from "express";
import { AuthRequest } from "../src/types";

const addAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ownerId, icon, type, name, subcategories, balance, currency, isMultiAccount, parentId } = req.body as {
      ownerId: string;
      icon: { color: string; icon_value: string };
      type: string;
      name: string;
      subcategories: Array<{ subcategory: string }>;
      balance?: number;
      currency?: string;
      time?: string;
      isMultiAccount?: boolean;
      isMainSubAccount?: boolean;
      parentId?: string;
    };
    const newAccount = await Accounts.create({
      ownerId,
      icon,
      type,
      name,
      subcategories,
      balance: balance ?? 0,
      initialBalance: balance ?? 0,
      currency: currency ?? "USD",
      isMultiAccount: isMultiAccount ?? false,
      isMainSubAccount: req.body.isMainSubAccount ?? false,
      parentId: parentId ?? null,
    });
    res.send({
      ok: true,
      data: `Account with tipe '${type}' '${name}' was created`,
      newAccount,
    });
  } catch (error) {
    const err = error as Error;
    res.send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const deleteAccount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { accountId } = req.body as { accountId: string };
    const accountExist = await Accounts.findById({ _id: accountId });
    if (accountExist) {
      const ownerId = accountExist.ownerId;
      await accountExist.deleteOne();

      // If this is a multi-account, cascade-delete all sub-accounts and their transactions
      const subAccounts = accountExist.isMultiAccount
        ? await Accounts.find({ parentId: accountId })
        : [];

      const allTriggeredAccSet = new Set<string>();

      // Collect affected accounts from sub-account transactions
      for (const sub of subAccounts) {
        const subTrans = await Transactions.find({
          $or: [{ senderId: sub._id }, { recipientId: sub._id }],
        });
        subTrans.forEach((t) => {
          allTriggeredAccSet.add(t.senderId.toString());
          allTriggeredAccSet.add(t.recipientId.toString());
        });
        await Transactions.deleteMany({
          $or: [{ senderId: sub._id }, { recipientId: sub._id }],
        });
        await sub.deleteOne();
      }

      const triggeredTrans = await Transactions.find({
        $or: [{ senderId: accountId }, { recipientId: accountId }],
      });
      triggeredTrans.forEach((trans) => {
        allTriggeredAccSet.add(trans.senderId.toString());
        allTriggeredAccSet.add(trans.recipientId.toString());
      });

      // Remove deleted IDs and the parent itself from recalc set
      allTriggeredAccSet.delete(accountId);
      subAccounts.forEach((s) => allTriggeredAccSet.delete(s._id.toString()));

      const triggeredAccs = Array.from(allTriggeredAccSet).map(
        (id) => new mongoose.Types.ObjectId(id),
      );

      const deletedTrans = await Transactions.deleteMany({
        $or: [{ senderId: accountId }, { recipientId: accountId }],
      });

      await updateBalance(triggeredAccs, ownerId.toString());

      res.send({
        ok: true,
        data: `Account '${accountExist.name}' was deleted`,
        deletedTrans,
      });
    } else {
      res.send({ ok: true, data: `Account was not found` });
    }
  } catch (error) {
    const err = error as Error;
    res.send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const updateBalance = async (
  accs: mongoose.Types.ObjectId[],
  ownerId: string,
): Promise<void> => {
  try {
    for (let i = 0; i < accs.length; i++) {
      const currentAccountId = accs[i];
      const currentAccount = await Accounts.findById(currentAccountId);

      const incomeTransactions = await Transactions.find({
        ownerId,
        recipientId: currentAccountId,
      });
      const expenseTransactions = await Transactions.find({
        ownerId,
        senderId: currentAccountId,
      });
      // Income amounts are received in the current account's currency (amount * rate)
      const incomeAmount = incomeTransactions.reduce(
        (accumulator, transaction) => accumulator + transaction.amount * transaction.rate,
        0,
      );
      // Expense amounts are sent in the current account's currency (just amount)
      const expenseAmount = expenseTransactions.reduce(
        (accumulator, transaction) => accumulator + transaction.amount,
        0,
      );
      if (currentAccount) {
        currentAccount.balance =
          currentAccount.initialBalance + incomeAmount - expenseAmount;
        if (currentAccount.type === "income") {
          currentAccount.balance *= -1;
        }
        await currentAccount.save();
      }
    }
  } catch (error) {
    const err = error as Error;
    console.log(err.message);
  }
};

const setBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { senderId, recipientId, userId } = req.body as {
      senderId: string;
      recipientId: string;
      userId: string;
    };

    const senderAccount = await Accounts.findById(senderId);
    const recipientAccount = await Accounts.findById(recipientId);

    if (!senderAccount || !recipientAccount) {
      res.status(400).send({ ok: false, data: "Account not found" });
      return;
    }

    const incomeSenderTransactions = await Transactions.find({
      ownerId: userId,
      recipientId: senderId,
    });
    const expenseSenderTransactions = await Transactions.find({
      ownerId: userId,
      senderId,
    });
    const incomeRecepientTransactions = await Transactions.find({
      ownerId: userId,
      recipientId,
    });
    const expenseRecepientTransactions = await Transactions.find({
      ownerId: userId,
      senderId: recipientId,
    });

    const incomeSenderAmount = incomeSenderTransactions.reduce(
      (accumulator, transaction) => accumulator + transaction.amount * transaction.rate,
      0,
    );
    const expenseSenderAmount = expenseSenderTransactions.reduce(
      (accumulator, transaction) => accumulator + transaction.amount,
      0,
    );
    const incomeRecepientAmount = incomeRecepientTransactions.reduce(
      (accumulator, transaction) => accumulator + transaction.amount * transaction.rate,
      0,
    );
    const expenseRecepientAmount = expenseRecepientTransactions.reduce(
      (accumulator, transaction) => accumulator + transaction.amount,
      0,
    );

    senderAccount.balance =
      senderAccount.initialBalance + incomeSenderAmount - expenseSenderAmount;
    if (senderAccount.type === "income") {
      senderAccount.balance *= -1;
    }

    recipientAccount.balance =
      recipientAccount.initialBalance +
      incomeRecepientAmount -
      expenseRecepientAmount;

    await senderAccount.save();
    await recipientAccount.save();
    res.status(200).send({
      ok: true,
      data: `Account balance was updated`,
      senderAccount,
      recipientAccount,
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const updateAccount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { accountData } = req.body as {
      accountData: { _id: string; [key: string]: unknown };
    };
    const account = await Accounts.findById({ _id: accountData._id });

    if (account) {
      const result = await Accounts.findOneAndUpdate(
        { _id: accountData._id },
        { $set: accountData },
        { new: true, runValidators: true },
      );
      res.status(200).send({
        ok: true,
        data: `Account '${req.body.name}' was updated`,
        result,
      });
    } else {
      res.status(200).send({
        ok: true,
        data: `Account was not found `,
      });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const getAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accountId } = req.params;
    const account = await Accounts.findById({ _id: accountId }).populate(
      "ownerId",
    );

    if (account) {
      res.status(200).send({ ok: true, data: account });
    } else {
      res.status(200).send({ ok: true, data: `Account was not found` });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

const getAllAccounts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const ownerId = req.params.id;

  try {
    let accounts = await Accounts.find({ ownerId }).populate("ownerId");
    const accountsJson = JSON.parse(JSON.stringify(accounts));
    if (accountsJson) {
      res.status(200).send({ ok: true, data: accountsJson });
    } else {
      res.status(200).send({ ok: true, data: `Accounts was not found ` });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).send({ ok: false, data: err.message });
    console.log(err.message);
  }
};

export { addAccount, getAllAccounts, setBalance, updateAccount, deleteAccount };
