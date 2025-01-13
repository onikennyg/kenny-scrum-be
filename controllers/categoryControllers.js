const Category = require("../models/categoryModels");

// function to create category
const createCategory = async (request, response) => {
  const { name, parent } = request.body;

  // Check if the 'name' field is provided
  if (!name) {
    return response.status(400).json({ message: "Category name is required" });
  }

  try {
    const category = await Category.create({ name, parent: parent || null });
    return response
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("Error creating category:", error);
    return response
      .status(500)
      .json({ message: "Error creating category", error });
  }
};


// function to delete category
const deleteCategory = async (request, response) => {
  const { categoryId } = request.params; // Extract category ID from the request parameters

  try {
    // Find the category by its ID
    const category = await Category.findById(categoryId);

    // If no category is found, return a 404 error
    if (!category) {
      return response.status(404).json({ message: "Category not found" });
    }

    // Delete the category
    await Category.findByIdAndDelete(categoryId);

    // Return a success message
    return response.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return response.status(500).json({ message: "Error deleting category", error });
  }
};





module.exports = {
  createCategory, 
  deleteCategory}
