const express = require('express');
const router = express.Router();
const {addAccount,getAllAccounts,setBalance,updateAccount,deleteAccount} = require('../controllers/accounts')

const {verify_token } = require("../middlewares/authMiddleware");


router.post('/addaccount',addAccount)
router.post('/updateaccount',updateAccount)
router.post('/setBalance',setBalance)
router.post('/deleteaccount',deleteAccount)
// http://localhost:4050/category/categories
// router.post('/add',verify_tokenAdmin, addPlace)  //
// router.post('/delete',verify_tokenAdmin, deletePlace) //
// router.post('/:oldtitle/update',verify_tokenAdmin, updatePlace) //
// router.get('/get/:placetitle', getPlace)
router.get('/getall/:id', getAllAccounts)
// router.post('/removePicture',verify_tokenAdmin, removePicture) //
// router.post('/comment',verify_token, addComment)
// router.post('/deletecomment',verify_token, deleteComment)
// router.post('/deletecommentAdmin',verify_tokenAdmin, deleteComment)
// router.post('/uploadPhotos',verify_tokenAdmin, uploadPlacePhotos) //
// router.post('/fetch',verify_tokenAdmin, addPlacesFromGoogle)


module.exports = router;