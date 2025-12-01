const express = require('express');
const router = express.Router();
const {
    getPublicCategories,
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { categoryValidation } = require('../middleware/validation');

// Public Routes
router.get('/public', getPublicCategories);

// Protected Routes (Admin/Super Admin)
router.get('/', authenticate, authorize('admin', 'super_admin'), getCategories);
router.get('/:id', authenticate, authorize('admin', 'super_admin'), getCategoryById);

// Super Admin Only
router.post('/', authenticate, authorize('super_admin'), categoryValidation, createCategory);
router.put('/:id', authenticate, authorize('super_admin'), updateCategory);
router.delete('/:id', authenticate, authorize('super_admin'), deleteCategory);

module.exports = router;
