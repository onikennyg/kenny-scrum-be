// DatabAse connection logic is defined here
// this is a template for backend


const mongoose = require("mongoose")
require("dotenv").config()

const connectDb = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI)
        console.log(`mongoDb connected successfully on : ${connect.connection.host}`);
        
    } catch (error) {
        throw new error (`Error : ${error.message}`)
    }
};






module.exports = connectDb