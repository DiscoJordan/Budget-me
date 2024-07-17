const Accounts = require("../models/accounts");
const Transactions = require("../models/transactions");

const addAccount = async (req, res) => {
  try {
    const { ownerId, icon, type, name, subcategories, currency, time } =
      req.body;
    let newAccount = await Accounts.create({
      ownerId: ownerId,
      // icon: icon,
      type: type,
      name: name,
      subcategories: subcategories,
      // currency: currency,
      // time: time,
    });
    res.send({
      ok: true,
      data: `Account with tipe '${type}' '${name}' was created`,
      newAccount,
    });
  } catch (error) {
    res.send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.body;
    const accountExist = await Accounts.findById({ _id: accountId });
    if (accountExist) {
      await accountExist.deleteOne();
      res.send({ ok: true, data: `Account '${accountId.name}' was deleted` });
    } else {
      res.send({ ok: true, data: `Account was not found` });
    }
  } catch (error) {
    res.send({ ok: false, data: error.message });
    console.log(error.message);
  }
};
const setBalance = async (req, res) => {
  try {
    const { senderId, recipientId, userId } = req.body;
    const senderAccount = await Accounts.findById(senderId);
    const recipientAccount = await Accounts.findById(recipientId);

    const incomeSenderTransactions = await Transactions.find(
      { ownerId: userId } && { recipientId: senderId }
    );
    const expenseSenderTransactions = await Transactions.find(
      { ownerId: userId } && { senderId: senderId }
    );
    const incomeRecepientTransactions = await Transactions.find(
      { ownerId: userId } && { recipientId: recipientId }
    );
    const expenseRecepientTransactions = await Transactions.find(
      { ownerId: userId } && { senderId: recipientId }
    );

    const incomeSenderAmount = incomeSenderTransactions.reduce(
      (accumulator, transaction) => accumulator + transaction.amount,
      0
    );
    const expenseSenderAmount = expenseSenderTransactions.reduce(
      (accumulator, transaction) => accumulator + transaction.amount,
      0
    );
    const incomeRecepientAmount = incomeRecepientTransactions.reduce(
      (accumulator, transaction) => accumulator + transaction.amount,
      0
    );
    const expenseRecepientAmount = expenseRecepientTransactions.reduce(
      (accumulator, transaction) => accumulator + transaction.amount,
      0
    );

    senderAccount.balance =
      senderAccount.initialBalance + incomeSenderAmount - expenseSenderAmount;
    senderAccount.type === "income" ? (senderAccount.balance *= -1) : null;

    recipientAccount.balance =
      senderAccount.initialBalance +
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
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

const updateAccount = async (req, res) => {
  try {
    const { accountId } = req.body;
    const account = await Accounts.findById({ _id: accountId });

    if (account) {
      const result = await Accounts.findOneAndUpdate(
        { _id: accountId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      res.status(200).send({
        ok: true,
        data: `Account '${req.body.name}' was updated`,
        result: result,
      });
    } else {
      res.status(200).send({
        ok: true,
        data: `Account was not found `,
      });
    }
  } catch (error) {
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

const getAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await Accounts.findById({ _id: accountId }).populate(
      "ownerId"
    );

    if (account) {
      res.status(200).send({ ok: true, data: account });
    } else {
      res.status(200).send({ ok: true, data: `Account was not found` });
    }
  } catch (error) {
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

const getAllAccounts = async (req, res) => {
  const ownerId = req.params.id;

  try {
    let accounts = await Accounts.find({ ownerId: ownerId }).populate(
      "ownerId"
    );
    accounts = JSON.parse(JSON.stringify(accounts));
    if (accounts) {
      res.status(200).send({ ok: true, data: accounts });
    } else {
      res.status(200).send({ ok: true, data: `Accounts was not found ` });
    }
  } catch (error) {
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

module.exports = { addAccount, getAllAccounts, setBalance };
