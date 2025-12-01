const Product = require('../models/Product');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const fs = require('fs');
const path = require('path');

// Public: Landing Page - Get All Active Products
const getPublicProducts = async (req, res, next) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            search: req.query.search,
            category_id: req.query.category_id,
            sort_by: req.query.sort_by,
            sort_order: req.query.sort_order,
            min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
            max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined
        };

        const result = await Product.findAllPublic(options);
        
        return paginatedResponse(res, result.products, {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        }, 'Products retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Public: Get Product by Slug (Product Detail Page)
const getProductBySlug = async (req, res, next) => {
    try {
        const product = await Product.findBySlug(req.params.slug);
        
        if (!product) {
            return errorResponse(res, 'Product not found', 404);
        }

        return successResponse(res, { product }, 'Product retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Admin/Super Admin: Get Products (Role-based)
const getProducts = async (req, res, next) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            search: req.query.search,
            category_id: req.query.category_id,
            sort_by: req.query.sort_by,
            sort_order: req.query.sort_order,
            min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
            max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined
        };

        let result;
        
        if (req.user.role === 'super_admin') {
            result = await Product.findAll(options);
        } else if (req.user.role === 'admin') {
            result = await Product.findByCreator(req.user.id, options);
        } else {
            return errorResponse(res, 'Access denied', 403);
        }
        
        return paginatedResponse(res, result.products, {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        }, 'Products retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Admin/Super Admin: Get Product by UUID
const getProductByUuid = async (req, res, next) => {
    try {
        const product = await Product.findByUuid(req.params.uuid);
        
        if (!product) {
            return errorResponse(res, 'Product not found', 404);
        }

        if (req.user.role === 'admin' && product.created_by !== req.user.id) {
            return errorResponse(res, 'Access denied', 403);
        }

        return successResponse(res, { product }, 'Product retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Admin/Super Admin: Create Product
const createProduct = async (req, res, next) => {
    try {
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            stock: req.body.stock,
            category_id: req.body.category_id,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords
        };

        if (req.file) {
            productData.image_url = `/${req.file.path.replace(/\\/g, '/')}`;
            productData.image_original_name = req.file.originalname;
            productData.image_mime_type = req.file.mimetype;
            productData.image_size = req.file.size;
        }

        const { uuid, slug } = await Product.create(productData, req.user.id);
        const product = await Product.findByUuid(uuid);

        return successResponse(res, { product }, 'Product created successfully', 201);
    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        next(error);
    }
};

// Admin/Super Admin: Update Product
const updateProduct = async (req, res, next) => {
    try {
        const productData = { ...req.body };

        if (req.file) {
            const existingProduct = await Product.findByUuid(req.params.uuid);
            if (existingProduct && existingProduct.image_url) {
                const oldPath = path.join(process.cwd(), existingProduct.image_url.substring(1));
                fs.unlink(oldPath, () => {});
            }
            
            productData.image_url = `/${req.file.path.replace(/\\/g, '/')}`;
            productData.image_original_name = req.file.originalname;
            productData.image_mime_type = req.file.mimetype;
            productData.image_size = req.file.size;
        }

        const isSuperAdmin = req.user.role === 'super_admin';
        const result = await Product.update(req.params.uuid, productData, req.user.id, isSuperAdmin);
        
        if (!result) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return errorResponse(res, 'Product not found', 404);
        }
        
        if (result.unauthorized) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return errorResponse(res, 'Access denied', 403);
        }

        return successResponse(res, { product: result }, 'Product updated successfully');
    } catch (error) {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        next(error);
    }
};

// Admin/Super Admin: Delete Product
const deleteProduct = async (req, res, next) => {
    try {
        const existingProduct = await Product.findByUuid(req.params.uuid);
        
        const isSuperAdmin = req.user.role === 'super_admin';
        const result = await Product.delete(req.params.uuid, req.user.id, isSuperAdmin);
        
        if (result.notFound) {
            return errorResponse(res, 'Product not found', 404);
        }
        
        if (result.unauthorized) {
            return errorResponse(res, 'Access denied', 403);
        }

        if (result.success && existingProduct && existingProduct.image_url) {
            const imagePath = path.join(process.cwd(), existingProduct.image_url.substring(1));
            fs.unlink(imagePath, () => {});
        }

        return successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPublicProducts,
    getProductBySlug,
    getProducts,
    getProductByUuid,
    createProduct,
    updateProduct,
    deleteProduct
};
