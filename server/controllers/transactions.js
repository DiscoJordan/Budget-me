const Transactions = require("../models/transactions");

// const transactionSchema = new mongoose.Schema({
//   ownerId:{ type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // owner of transaction
//   senderId:{ type:mongoose.Schema.Types.ObjectId, ref: 'Account', required: true}, // account sender
//   recipientId:{ type:mongoose.Schema.Types.ObjectId, ref: 'Account', required: true}, // account recipient
//   icon: {  // if sender is income account, should use icon of sender acc, if sender is personal acc, should use icon of recipient acc
//     color: { type: String, required: false, unique: false, default: 'gray' },
//     icon_value: { type: String, required: false },
//   },
//   name: { type: String, required: true, unique: false }, // name of transaction
//   subcategory:{ type: String, required: false ,default: 'No subcategory'}, // subcategory of transaction
//   amount: { type: Number, required: true, default: 0 }, // amount of transaction in recipient currensy
//   currency: { type: String, required: true, default: 'USD' }, // initial currensy of account
//   time: { type: Date, default: Date.now },  // date of transaction
//   rate: { type: String, required: true,default: 1 },  // rate of transaction
//   comment: { type: String, required: false },  // comment of transaction

const addTransaction = async (req, res) => {
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
    } = req.body;
    let newTransaction = await Transactions.create({
      ownerId: ownerId,
      senderId: senderId,
      recipientId: recipientId,
      icon: icon,
      name: name,
      subcategory: subcategory,
      amount: amount,
      currency: currency,
      time: time,
      comment: comment,
    });
    res.send({
      ok: true,
      data: `Transaction was created`,
      newTransaction
    });
  } catch (error) {
    res.send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transactionExist = await Transactions.findById({ _id: transactionId });
    if (transactionExist) {
      await transactionExist.deleteOne();
      res.send({ ok: true, data: `Account '${transactionExist.name}' was deleted` });
    } else {
      res.send({ ok: true, data: `Account was not found` });
    }
  } catch (error) {
    res.send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

const updateAccount = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transactions.findById({ _id: transactionId });

    if (transaction) {
      const result = await Transactions.findOneAndUpdate(
        { _id: transactionId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      res.status(200).send({
        ok: true,
        data: `Transaction '${transaction.name}' was updated`,
        result: result,
      });
    } else {
      res.status(200).send({
        ok: true,
        data: `Transaction was not found `,
      });
    }
  } catch (error) {
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

const getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transactions.findById({ _id: transactionId }).populate(
      "ownerId",'senderId','recipientId'
    );

    if (transaction) {
      res.status(200).send({ ok: true, data: transaction });
    } else {
      res.status(200).send({ ok: true, data: `Transaction was not found` });
    }
  } catch (error) {
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

const getAllTransactions = async (req, res) => {
  const ownerId = req.params.id;
  try {
    let transactions = await Transactions.find({ ownerId: ownerId }).populate(
      ["ownerId","senderId","recipientId"]
    );
    transactions = JSON.parse(JSON.stringify(transactions));
    if (transactions) {
      res.status(200).send({ ok: true, data: transactions });
    } else {
      res.status(200).send({ ok: true, data: `Transactions was not found ` });
    }
  } catch (error) {
    res.status(400).send({ ok: false, data: error.message });
    console.log(error.message);
  }
};

module.exports = {addTransaction,getAllTransactions};
