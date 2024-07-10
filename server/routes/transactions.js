const express = require('express');
const router = express.Router();
const {} = require('../controllers/transactions')
    
const {verify_tokenAdmin } = require("../middlewares/authMiddleware");

// http://localhost:4050/tag/....
// router.post('/add',verify_tokenAdmin, addTag)   /* trigger certain function*/
// router.get('/get', getTag)
// router.get('/getall', getAllTags)



module.exports = router;