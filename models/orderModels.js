const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,  // Reference to customer model
        ref: 'User',  // This accesses your userModel
        required: true
    },
    orderItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,  // Reference to product model
                ref: 'Product',  // This accesses your productModel
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1  // Defaults to 1 if not provided
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String },
        country: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Credit Card', 'PayPal', 'Bank Transfer']  // Allowed payment methods
    },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String }
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    discountPrice: { 
        type: Number, 
        default: 0 
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isCanceled: { 
        type: Boolean, 
        default: false 
    },
    canceledAt: { 
        type: Date 
    },
});






module.exports = mongoose.model("Order", orderSchema)