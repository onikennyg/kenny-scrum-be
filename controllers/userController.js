// User Controllers will be defined here(every function that user will perform)
// this folder will contain every function a user will perform

// import your usermodel
const User = require("../models/userModels");

const generateToken = require("../utility-utils/generatetokens");

// import crypto
const crypto = require("crypto");

const sendMail = require("../utility-utils/email");





// function to register user
const registerUser = async (request, response) => {
    // request body comes from the front-end
    const { firstName, lastName, email, phone, password } = request.body;
  
    const userExists = await User.findOne({ email });
    if (userExists) {
      response.status(400).json({ error: "User already exists..." });
    }
  
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
    });
  
    
    if (user) {
      const token = generateToken(user._id);
  
      response.cookie("jwt", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
  
      response.status(201).json({
        message: "User registered succesfully",
        user,
        token,
      });
    } else {
      response.status(400).json({ error: "Invalid user data" });
    }
  };




// function to register Admin
const registerAdmin = async(request, response) => {
const {firstName,lastName, email, phone, password} = request.body

const userExists = await User.findOne({email})
if (userExists) {
    return response.status(400).json({error : "User already exists"})
} 

const admin = await User.create({firstName, lastName, email, phone, password, isAdmin:true})

if (admin) {
    response.status(201).json({message: "admin created successfully"})
} else{
    response.status(400).json({error: "Invalid user data"})
}
}





// function to login user
const userLogin = async (request, response) => {
    // Extract email and password from the request body
    const { email, password } = request.body;
    // Check if user exists by email
    const user = await User.findOne({ email });
  
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
  
      response.cookie("jwt", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
  
      response.status(201).json({
        message: "User logged in succesfully",
        user,
        token,
      });
    } else {
      response.status(401).json({ error: "Invalid  user email or password" });
    }
  };






  // function to login admin
const loginAdmin = async (request, response) => {
    // Extract email and password from the request body
    const { email, password } = request.body;
  
    // Check if user exists by email
    const admin = await User.findOne({ email });
  
    // Check if the user exists, if the password matches, and if the user is an admin
    if (admin && (await admin.matchPassword(password)) && admin.isAdmin) {
      const token = generateToken(admin._id);
  
      // Set JWT cookie with httpOnly and strict policies
      response.cookie("jwt", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days expiration
      });
  
      // Send successful login response
      response.status(201).json({
        message: "Admin logged in successfully",
        admin,
        token,
      });
    } else {
      // Send an error response for invalid credentials or non-admin user
      response.status(401).json({ error: "Invalid admin email or password" });
    }
  };

  




//   function that redirects you to reset password
// forgot password function for users
const forgotPassword = async (request, response) => {
  const { email } = request.body;

  const user = await User.findOne({ email });

  if (!user) {
    response.status(404);
    throw new Error("user not found");
  }

  // generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  const resetUrl = `${request.protocol}://${request.get(
    "host"
  )}/api/users/reset-password/${resetToken}`;
  const message = `You are receiving this email because you or someone else has requested a reset of your password. Please click the following link to reset your password: \n\n ${resetUrl}`;

  await sendMail({
    email: user.email,
    subject: "Password reset token",
    message,
  });

  response
    .status(200)
    .json({ success: true, data: "Reset link sent to email..." });
};






// function to reset password
// reset password function for users
// resetPassword function
const resetPassword = async (request, response) => {
    const { resetToken } = request.params;
    const { password } = request.body;
  
    // Hash the token from the URL
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  
    // Find user by reset token and check if token has not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
  
    if (!user) {
      response.status(400);
      throw new Error("Invalid or expired token");
    }
  
    // Set new password
    user.password = password;
    
    // Clear reset token and expiration fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
  
    await user.save();
  
    response.status(200).json({
      success: true,
      data: "Password reset successful"
    });
  };







// forgot password function for admin
const forgotPasswordAdmin = async (request, response) => {
    const { email } = request.body;
  
    // Check if the user exists and is an admin
    const admin = await User.findOne({ email, isAdmin: true });

    if (!admin) {
        return response.status(404).json({ error: "Admin not found" });
    }

    // Check if the user is an admin
    if (!admin.isAdmin) {
        return response.status(403).json({ error: "Access denied. Not an admin." });
    }
    // generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    admin.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiration
  
    await admin.save();
  
    const resetUrl = `${request.protocol}://${request.get(
      "host"
    )}/api/admin/reset-password/${resetToken}`;
    const message = `You are receiving this email because you or someone else has requested a reset of your admin password. Please click the following link to reset your password: \n\n ${resetUrl}`;
  
    // Send the reset password email
    await sendMail({
      email: admin.email,
      subject: "Admin Password Reset Token",
      message,
    });
  
    response.status(200).json({ success: true, data: "Reset link sent to email..." });
  };





  
// reset password function for admin
const resetPasswordAdmin = async (request, response) => {
    // Get the token from URL params
    const resetToken = request.params.token;
  
    // Hash the token received in the URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
  
    // Find the admin by the resetPasswordToken and ensure the token has not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // Ensure the token has not expired
      isAdmin: true, // Ensure the user is an admin
    });
  
    if (!user) {
      return response.status(400).json({ error: "Invalid or expired token" });
    }
  
    // Set the new password
    const { password } = request.body;
    user.password = password;
  
    // Clear the resetPasswordToken and resetPasswordExpire fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
  
    await user.save();
  
    // Generate a new token for the admin after resetting the password
    const token = generateToken(user._id);
  
    // Set the token in a cookie
    response.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  
    response.status(200).json({
      message: "Admin password reset successful",
      user,
      token,
    });
  };




  

// function to logout user
const logoutUser = async (request, response) => {
  try {
    // Clear the JWT cookie by setting it to an empty string and giving it a very short expiration time
    response.cookie("jwt", "", {
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(0), // Setting the expiration to the past to clear the cookie
    });

    response.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    response.status(500).json({ error: "Server error, please try again" });
  }
};





  // function to logout admin
const logoutAdmin = async (request, response) => {
  try {
    // Clear the JWT cookie by setting it to an empty string and giving it a very short expiration time
    response.cookie("jwt", "", {
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(0), // Setting the expiration to the past to clear the cookie
    });

    response.status(200).json({ message: "Admin logged out successfully" });
  } catch (error) {
    response.status(500).json({ error: "Server error, please try again" });
  }
};





  // function to get all users (accessible to everyone)
const getAllUsers = async (request, response) => {
    try {
      // Get all users from the database (excluding sensitive data like passwords)
      const users = await User.find({}).select("-password");
  
      // Send the list of users back to the client
      response.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      response.status(500).json({ error: "Server error" });
    }
  };





// function to get a single user by ID
const getSingleUser = async (request, response) => {
    try {
      // Get user by ID from request parameters
      const user = await User.findById(request.params.id).select("-password");
  
      if (!user) {
        return response.status(404).json({ error: "User not found" });
      }
  
      // Return user details
      response.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      response.status(500).json({ error: "Server error" });
    }
  };
  

  



//  // function to update user profile (accessible to anyone)
const updateUserProfile = async (request, response) => {
  try {
    // Get the user ID from request parameters (or you can get it from the auth token)
    const userId = request.params.id;

    // Find the user by ID
    const user = await User.findById(userId);

    if (user) {
      // Update the fields if they are provided in the request body
      user.firstName = request.body.firstName || user.firstName;
      user.lastName = request.body.lastName || user.lastName;
      user.email = request.body.email || user.email;
      user.phone = request.body.phone || user.phone;
      if (request.body.password) {
        user.password = request.body.password; // Make sure to hash this password before saving
      }

      // Save the updated user to the database
      const updatedUser = await user.save();

      // Respond with the updated user information
      response.status(200).json({
        message: "User profile updated successfully",
        user: updatedUser
      });
    } else {
      // If user is not found, return 404 status
      response.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    // Handle any server or database errors
    response.status(500).json({ error: "Server error, please try again" });
  }
};
  

// // function to update admin profile (accessible to anyone)
// const updateAdminProfile = async (request, response) => {
//   try {
//     // Get the admin ID from request parameters (or you can get it from the auth token)
//     const adminId = request.params.id;

//     // Find the admin by ID
//     const admin = await Admin.findById(adminId); // Assuming 'Admin' is the model for admins

//     if (admin) {
//       // Update the fields if they are provided in the request body
//       admin.fullName = request.body.fullName || admin.fullName;
//       admin.email = request.body.email || admin.email;
//       admin.phone = request.body.phone || admin.phone;
//       admin.role = request.body.role || admin.role; // Specific to admins
//       admin.permissions = request.body.permissions || admin.permissions; // Specific to admins
//       if (request.body.password) {
//         admin.password = request.body.password; // Make sure to hash this password before saving
//       }

//       // Save the updated admin to the database
//       const updatedAdmin = await admin.save();

//       // Respond with the updated admin information
//       response.status(200).json({
//         message: "Admin profile updated successfully",
//         admin: updatedAdmin
//       });
//     } else {
//       // If admin is not found, return 404 status
//       response.status(404).json({ message: "Admin not found" });
//     }
//   } catch (error) {
//     // Handle any server or database errors
//     response.status(500).json({ error: "Server error, please try again" });
//   }
// };
  
  

// function to update admin profile (accessible to admins only)
const updateAdminProfile = async (request, response) => {
  try {
    // Get the admin ID from request parameters (or from the auth token if applicable)
    const adminId = request.params.id;

    // Find the admin by ID
    const admin = await User.findById(adminId);

    // Check if the user is an admin
    if (admin && admin.isAdmin) {
      // Update the fields if they are provided in the request body
      admin.firstName = request.body.firstName || admin.firstName;
      admin.lastName = request.body.lastName || admin.lastName;
      admin.email = request.body.email || admin.email;
      admin.phone = request.body.phone || admin.phone;
      if (request.body.password) {
        admin.password = request.body.password; // Ensure the password is hashed before saving
      }

      // Save the updated admin to the database
      const updatedAdmin = await admin.save();

      // Respond with the updated admin information
      response.status(200).json({
        message: "Admin profile updated successfully",
        admin: updatedAdmin
      });
    } else {
      // If admin is not found or is not an admin, return 404 or unauthorized status
      response.status(404).json({ message: "Admin not found or not authorized" });
    }
  } catch (error) {
    // Handle any server or database errors
    response.status(500).json({ error: "Server error, please try again" });
  }
};



  

  

// every function you create inside the user controller, you have to export it here inside the curly brace
module.exports = {
  registerUser,
  registerAdmin,
  userLogin,
  loginAdmin,
  forgotPassword,
  forgotPasswordAdmin,
  resetPassword,
  resetPasswordAdmin,
  logoutUser,
  logoutAdmin,
  getAllUsers,
  getSingleUser,
  updateUserProfile,
  updateAdminProfile
}