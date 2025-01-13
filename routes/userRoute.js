// This is where we will be difining all the end-point(users end-point will be defined here)
const express = require("express")
const { registerUser, userLogin, forgotPassword, logoutUser, resetPassword, registerAdmin, loginAdmin, getAllUsers, getSingleUser, updateUserProfile, updateAdminProfile, forgotPasswordAdmin, resetPasswordAdmin, logoutAdmin } = require("../controllers/userController")
const { protect, admin } = require("../middlewares/authMiddleware")
const router = express.Router()

// Route to register a new user
router.post("/register", registerUser);

// Route to register a new admin user
router.post("/registerAdmin", registerAdmin);

// Route for user login
router.post("/login", userLogin);

// Route for admin login
router.post("/loginAdmin", loginAdmin);

// Route for initiating forgot password process for users
router.post("/forgot-password", forgotPassword);

// Route for resetting the password with a reset token for users
router.put("/reset-password/:resetToken", resetPassword);

// Route for initiating forgot password process for admins
router.post("/forgot-password-Admin", forgotPasswordAdmin);

// Route for resetting the password with a reset token for admins
router.put("/reset-password-Admin/:resetToken", resetPasswordAdmin);

// Route for user logout (protected route)
router.post("/logout-User", protect, logoutUser);

// Route for admin logout (protected route, only accessible by admins)
router.post("/logout-Admin", protect, admin, logoutAdmin);

// Route to get all users (protected route, only accessible by admins)
router.get('/get-all-users', protect, admin, getAllUsers);

// Route to get a single user by their ID (protected route, accessible to authenticated users)
router.get('/get-single-user/:id', protect, getSingleUser);

// Route to update user profile (protected route, accessible to authenticated users)
router.put('/update-user-profile/:id', protect, updateUserProfile);

// Route to update admin profile (protected route, only accessible by admins)
router.put('/update-admin-profile/:id', protect, admin, updateAdminProfile);





















module.exports = router