const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  ownerId:{ type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // owner of account
  icon: {
    color: { type: String, required: false, unique: false, default: 'gray' },
    icon_value: { type: String, required: true, default:'wallet-outline' },
  },
  type: { type: String, required: true, unique: false }, // income/personal/expense
  name: { type: String, required: true, unique: false }, // Salary/ Wallet
  subcategories:[
    {
    subcategory:{ type: String, required: false ,default: 'No subcategory'},
    }
  ],
  balance: { type: Number, required: true, default: 0 },
  initialBalance: { type: Number, required: true, default: 0 },//balance of account
  currency: { type: String, required: true, default: 'USD' }, // initial currensy of account
  time: { type: Date, default: Date.now },  // date when acc was created

});

module.exports = mongoose.model("Account", accountSchema);
