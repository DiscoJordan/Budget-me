const express = require('express');
const router = express.Router();
const {addTransaction,getAllTransactions} = require('../controllers/transactions')
    
const {verify_tokenAdmin } = require("../middlewares/authMiddleware");


// http://localhost:4050/tag/....
// router.post('/add',verify_tokenAdmin, addTag)   /* trigger certain function*/
router.post('/addTransaction', addTransaction)
router.get('/getall/:id', getAllTransactions)



module.exports = router;