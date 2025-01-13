// Product Schema will be defined here
const mongoose = require("mongoose")


const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true // Make it mandatory to link a product to a category
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    rating: {
        type: Number,
        default: 1,
        min: 1,
        max: 5.
    },
    numReviews: {
        type: Number,
        default: 0
    },

    // image: {
    //     type: String,
    //     required: true
    // },
    // images: [
    //     {
    //         type: String,
    //     }
    // ],
    isFeatured: {
        type: Boolean,
        default: false
    },
    // for discount and sales
    discount: {
        type: Number,
        default: 0
    },

    // tracking who created or modified the product
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, {
    timestamps: true
});













module.exports = mongoose.model('Product', productSchema);
