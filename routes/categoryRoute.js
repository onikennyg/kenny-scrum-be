const express = require('express')
const { createCategory, deleteCategory} = require('../controllers/categoryControllers')

const router = express.Router()

router.post('/create-categories', createCategory);
router.delete("/delete-categories/:categoryId", deleteCategory);




module.exports = router