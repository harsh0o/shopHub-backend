const express = require('express');
const router = express.Router();
const {
    getPublicProducts,
    getProductBySlug,
    getProducts,
    getProductByUuid,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { productValidation, productUpdateValidation, uuidParam, paginationQuery } = require('../middleware/validation');
const upload = require('../config/multer');

// Public Routes (No Auth Required)
router.get('/public', paginationQuery, getPublicProducts);
router.get('/public/:slug', getProductBySlug);

// Protected Routes (Admin/Super Admin Only)
router.get('/', authenticate, authorize('admin', 'super_admin'), paginationQuery, getProducts);
router.get('/:uuid', authenticate, authorize('admin', 'super_admin'), uuidParam, getProductByUuid);
router.post('/', authenticate, authorize('admin', 'super_admin'), upload.single('image'), productValidation, createProduct);
router.put('/:uuid', authenticate, authorize('admin', 'super_admin'), uuidParam, upload.single('image'), productUpdateValidation, updateProduct);
router.delete('/:uuid', authenticate, authorize('admin', 'super_admin'), uuidParam, deleteProduct);

module.exports = router;
