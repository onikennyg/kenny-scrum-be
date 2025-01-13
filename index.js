// this is the actual server and entry point

// importing express
const express = require("express")

// initializing express into an app variable
const app = express()

// port
const port = 9897

// importing database function
const connectDb = require("./database-config/db")

// Executing database function
connectDb()

// importing user route
const userRoute = require("./routes/userRoute")

// importing product route
const productRoute = require("./routes/productRoute")

// importing order route
const orderRoute = require("./routes/orderRoute")

// importing order route
const categoryRoute = require("./routes/categoryRoute")

// middleware
// to use json
app.use(express.json())

// to useurl encoded values instead of json
app.use(express.urlencoded({extended : true}))


// testing route
app.get("/api", (request, response) => {
    response.json({message: "Welcome to my server..."})
})

// using the userRoute
app.use("/api/users", userRoute)

// using the productRoute
app.use ("/api/products", productRoute)

// using the orderRoute
app.use ("/api/orders", orderRoute)

// using the categoryRoute
app.use ("/api/categories", categoryRoute)

































// listening to port.......
app.listen(9897, () => {
    console.log("Server connected successfully");
    
})