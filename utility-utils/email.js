// import nodemailer
const nodeMailer = require("nodemailer")
// import .env
require("dotenv").config()

const sendMail = async (options) => {
    const transporter = nodeMailer.createTransport({
        service : "Gmail",
        auth :{user : process.env.EMAIL_USERNAME,
        pass : process.env.EMAIL_PASSWORD
        }
    })

    const mailOptions = {
        from : process.env.EMAIL_USERNAME,
        to : options.email,
        subject : options.subject,
        text : options.message
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log("Email sent successfully");
        
    } catch (error) {
        console.log(`${error} : Error sending mail`);

        const errorMessage = error.message?.includes("ECONNREFUSED")
        ? "There seems to be a problem with the email server connection. pleases try again later"
        : (error.message.includes("Invalid login")
        ? "The provided email credentials might be incorrect. please check your .env file"
        : "An error occured whilst sending the password reset email")

        throw new Error(errorMessage)
    }
}



module.exports = sendMail