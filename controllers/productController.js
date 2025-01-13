// Product Controllers will be defined here(every function that would be performed on a product)
// this folder will contain every function that would be performed on a product

const Product = require("../models/productModels")
const Category = require("../models/categoryModels")



// function to get all products
const getAllProducts = async (request, response) => {
    try {
      // Pagination variables
      const pageSize = 10; // Number of products per page
      const page = Number(request.query.pageNumber) || 1;
  
      // Filtering based on query parameters (e.g., by category, brand, etc.)
      const category = request.query.category ? { category: request.query.category } : {};
      const brand = request.query.brand ? { brand: request.query.brand } : {};
  
      // Keyword search (for product name or description)
      const keyword = request.query.keyword
        ? {
            $or: [
              { name: { $regex: request.query.keyword, $options: "i" } }, // Case-insensitive regex search in name
              { description: { $regex: request.query.keyword, $options: "i" } }, // Case-insensitive regex search in description
            ],
          }
        : {};
  
      // Combining filters
      const filter = { ...category, ...brand, ...keyword };
  
      // Get total count of products that match the filter
      const count = await Product.countDocuments({ ...filter });
  
      // Fetch products with pagination and sorting (newest first)
      const products = await Product.find({ ...filter })
        .populate('user', 'name email') // Populate the user who created/modified the product
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(pageSize)
        .skip(pageSize * (page - 1));
  
      // Respond with the products and pagination info
      response.status(200).json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        totalProducts: count,
      });
    } catch (error) {
      // Handle any errors
      response.status(500).json({ error: "Server error, please try again" });
    }
  };





  // function to get a single product by ID
const getSingleProduct = async (request, response) => {
    try {
      // Extract the product ID from the request parameters
      const productId = request.params.id;
  
      // Find the product by its ID
      const product = await Product.findById(productId).populate('user', 'name email');
  
      // Check if the product was found
      if (product) {
        response.status(200).json(product);
      } else {
        // If the product is not found, return a 404 error
        response.status(404).json({ message: "Product not found" });
      }
    } catch (error) {
      // Handle any errors (e.g., invalid product ID format)
      response.status(500).json({ error: "Server error, please try again" });
    }
  };
  

  

  // function to create a new product
const createProduct = async (request, response) => {
    try {
      // Extract product details from the request body
      const {
        name,
        description,
        price,
        categoryId,
        brand,
        stock,
        rating,
        numReviews,
        // imageUrl,
        isFeatured,
        discount,
      } = request.body;
  
      // Validate required fields
      if (!name || !description || !price || !categoryId || !brand || !stock
        //  || !imageUrl
        ) {
        return response.status(400).json({ error: "All required fields must be provided" });
      }
      const category = await Category.findById(categoryId);
      if (!category) {
        return response.status(404).json({message: "Category not found"});
      }
      // Create a new product using the Product model
      const product = new Product({
        name,
        description,
        price,
        categoryId,
        brand,
        stock,
        rating: rating || 1, // default rating if not provided
        numReviews: numReviews || 0, // default number of reviews if not provided
        // imageUrl,
        isFeatured: isFeatured || false, // default to false if not provided
        discount: discount || 0, // default discount if not provided
        user: request.user._id, // The logged-in user creating the product
      });
  
      // Save the new product to the database
      const createdProduct = await product.save();
      
  
      // Return the newly created product in the response
      response.status(201).json({
        message: "Product created successfully",
        product: createdProduct,
      });
    } catch (error) {
      // Handle any errors during the process
      response.status(500).json({ error: "Server error, unable to create product" });
    }
  };









// /// function to create a new product
// const createProduct = async (request, response) => {
//   try {
//     // Destructuring product fields from the request body
//     const {
//       name,
//       description,
//       price,
//       category,
//       brand,
//       stock,
//       image,     // main image of the product
//       images,    // additional images of the product
//       isFeatured,
//       discount,
//     } = request.body;

//     // Ensure required fields are present
//     if (
//       !name ||
//       !description ||
//       price === undefined ||
//       !category ||
//       !brand ||
//       stock === undefined ||
//       !image
//     ) {
//       return response.status(400).json({ message: "Please provide all required fields" });
//     }

//     // Create a new product instance
//     const product = new Product({
//       name: name.trim(),
//       description: description.trim(),
//       price: Number(price),
//       category: category.trim(),
//       brand: brand.trim(),
//       stock: Number(stock),
//       image: image.trim(), // Ensuring the main image URL is properly formatted
//       images: images && images.length > 0 ? images.map(img => img.trim()) : [], // Additional images array
//       isFeatured: isFeatured || false,
//       discount: discount || 0,
//       user: request.user._id, // Assuming the authenticated user is attached to the request
//     });

//     // Save the product to the database
//     const createdProduct = await product.save();

//     // Respond with the newly created product
//     response.status(201).json(createdProduct);
//   } catch (error) {
//     // Handle any server errors
//     console.error(error); // Logging the error for debugging
//     response.status(500).json({ error: "Server error, please try again" });
//   }
// };








  // function to update a product by ID
const updateProduct = async (request, response) => {
    try {
      // Extract the product ID from the request parameters
      const productId = request.params.id;
  
      // Find the product by ID in the database
      let product = await Product.findById(productId);
  
      // If the product doesn't exist, return a 404 error
      if (!product) {
        return response.status(404).json({ message: "Product not found" });
      }
  
      // Update the fields only if they are provided in the request body
      product.name = request.body.name || product.name;
      product.description = request.body.description || product.description;
      product.price = request.body.price || product.price;
      product.category = request.body.category || product.category;
      product.brand = request.body.brand || product.brand;
      product.stock = request.body.stock || product.stock;
      product.rating = request.body.rating || product.rating;
      product.numReviews = request.body.numReviews || product.numReviews;
    //   product.imageUrl = request.body.imageUrl || product.imageUrl;
      product.isFeatured = request.body.isFeatured !== undefined ? request.body.isFeatured : product.isFeatured;
      product.discount = request.body.discount || product.discount;
  
      // Save the updated product to the database
      const updatedProduct = await product.save();
  
      // Return the updated product in the response
      response.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      // Handle any errors during the process
      response.status(500).json({ error: "Server error, unable to update product" });
    }
  };





  





// function to get top-rated products
const getTopProducts = async (request, response) => {
    try {
      // Get top products sorted by rating in descending order
      const topProducts = await Product.find({})
        .sort({ rating: -1 })  // Sort by rating in descending order
        .limit(5);              // Limit to the top 5 products (you can adjust this as needed)
  
      // Send back the top products as a response
      response.status(200).json(topProducts);
    } catch (error) {
      // Handle any errors during the process
      response.status(500).json({ error: "Server error, unable to fetch top products" });
    }
  };

  



// function to delete product by ID
  const deleteProduct = async (request, response) => {
    const { id } = request.params;  // Get the product ID from the URL parameters
  
    // Check if the product ID is provided
    if (!id) {
        return response.status(400).json({ message: "You have to pass in a product ID" });
    }
  
    try {
        // Find and delete the product by ID
        const product = await Product.findByIdAndDelete(id);
  
        // Check if the product exists
        if (!product) {
            return response.status(404).json({ message: `No product found with the ID "${id}"`});
        }
  
        // Return success message after deletion
        response.status(200).json({ message: `Product with ID: ${id} has been deleted successfully` });
    } catch (error) {
        console.error("Error deleting product:", error);
        response.status(500).json({ message: "Server error, please try again later" });
      }
  };







  module.exports = {
    getAllProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getTopProducts
}