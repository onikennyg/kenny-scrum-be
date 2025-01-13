// This is where we will be difining all the end-point(products end-point will be defined here)
const express = require("express")
const { getAllProducts, getSingleProduct, createProduct, updateProduct, deleteProduct, getTopProducts } = require("../controllers/productController")
const { protect, admin } = require("../middlewares/authMiddleware")
const  upload  = require("../middlewares/uploadMiddleware")
const router = express.Router()



//  Product Routes

// Public route to get all products (accessible to everyone)
router.get("/get-all-products", getAllProducts);

// Public route to get single product (accessible to everyone)
router.get("/get-single-product/:id", getSingleProduct);

// Protect the route so only authenticated users can create products
router.post("/create-products", protect, admin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 10 }]), createProduct);

// Protect the route so only authenticated users (admins or authorized users) can update products
router.put("/update-product/:id", protect, admin, updateProduct);

// Protect the route so only authenticated users (admins or authorized users) can delete products
router.delete("/delete-products/:id", protect, admin, deleteProduct);

// Route to get top-rated products
router.get("/get-top-products/top", getTopProducts);
















module.exports = router
