const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  ownerId:{ type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // owner of transaction
  senderId:{ type:mongoose.Schema.Types.ObjectId, ref: 'Account', required: true}, // account sender
  recipientId:{ type:mongoose.Schema.Types.ObjectId, ref: 'Account', required: true}, // account recipient
  icon: {  // if sender is income account, should use icon of sender acc, if sender is personal acc, should use icon of recipient acc
    color: { type: String, required: false, unique: false, default: 'gray' },
    icon_value: { type: String, required: false },
  },
  name: { type: String, required: true, unique: false }, // name of transaction
  subcategory:{ type: String, required: false ,default: 'No subcategory'}, // subcategory of transaction
  amount: { type: Number, required: true, default: 0 }, // amount of transaction in recipient currensy
  currency: { type: String, required: true, default: 'USD' }, // initial currensy of account
  time: { type: Date, default: Date.now },  // date of transaction
  rate: { type: String, required: true,default: 1 },  // rate of transaction
  comment: { type: String, required: false },  // comment of transaction

});

module.exports = mongoose.model("Transaction", transactionSchema);
