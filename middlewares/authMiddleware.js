// A middleware is a function that has access to the request and response object

const User = require("../models/userModels");
const jwt = require("jsonwebtoken")
require("dotenv").config()

// middleware to check for authentication || to check if all users are logged in and have a token
const protect = async (request, response, next) => {
    let token;
    if (request.headers.authorization && request.headers.authorization.startsWith("Bearer")) {
      try {
        // The space between the split is very important i.e space inbetween " "
        token = request.headers.authorization.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
  
        request.user = await User.findById(decoded.id).select("-password")
  
        if (!request.user) {
          return response.status(401).json({message : "Not authorised, User not found"})
        }
        next()
      } catch (error) {
        return response.status(401).json({message : "Not authorised, Token failed"})
      }
    }else{
      return response.status(401).json({message : "Not authorised, No token"})
    }
  }



// middleware to check for authentication for admins || to check if isAdmin is = true
const admin = (request, response, next) => {
    if (request.user && request.user.isAdmin) {
      next()
    }else{
      return response.status(403).json({message : "Not authorised as an Admin"})
    }
  }






module.exports = {protect, admin}