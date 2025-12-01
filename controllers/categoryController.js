const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/response');

// Public: Get All Categories
const getPublicCategories = async (req, res, next) => {
    try {
        const categories = await Category.findAll(true);
        return successResponse(res, { categories }, 'Categories retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Admin/Super Admin: Get All Categories
const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.findAll(false);
        return successResponse(res, { categories }, 'Categories retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Admin/Super Admin: Get Category by ID
const getCategoryById = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return errorResponse(res, 'Category not found', 404);
        }

        return successResponse(res, { category }, 'Category retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Create Category
const createCategory = async (req, res, next) => {
    try {
        const { id, slug } = await Category.create(req.body);
        const category = await Category.findById(id);

        return successResponse(res, { category }, 'Category created successfully', 201);
    } catch (error) {
        next(error);
    }
};

// Super Admin: Update Category
const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.update(req.params.id, req.body);
        
        if (!category) {
            return errorResponse(res, 'Category not found', 404);
        }

        return successResponse(res, { category }, 'Category updated successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Delete Category
const deleteCategory = async (req, res, next) => {
    try {
        const deleted = await Category.delete(req.params.id);
        
        if (!deleted) {
            return errorResponse(res, 'Category not found', 404);
        }

        return successResponse(res, null, 'Category deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPublicCategories,
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
