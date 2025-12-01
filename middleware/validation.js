const { body, param, query, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation failed', 400, errors.array());
    }
    next();
};

const loginValidation = [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate
];

const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
];

const productValidation = [
    body('name').trim().notEmpty().withMessage('Product name required').isLength({ max: 255 }),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('category_id').optional().isInt().withMessage('Valid category ID required'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
    body('description').optional().trim(),
    body('meta_title').optional().trim().isLength({ max: 255 }),
    body('meta_description').optional().trim(),
    body('meta_keywords').optional().trim().isLength({ max: 500 }),
    validate
];

const productUpdateValidation = [
    body('name').optional().trim().notEmpty().isLength({ max: 255 }),
    body('price').optional().isFloat({ min: 0 }),
    body('category_id').optional().isInt(),
    body('stock').optional().isInt({ min: 0 }),
    body('description').optional().trim(),
    body('meta_title').optional().trim().isLength({ max: 255 }),
    body('meta_description').optional().trim(),
    body('meta_keywords').optional().trim().isLength({ max: 500 }),
    validate
];

const categoryValidation = [
    body('name').trim().notEmpty().withMessage('Category name required').isLength({ max: 100 }),
    body('description').optional().trim(),
    validate
];

const uuidParam = [
    param('uuid').isUUID().withMessage('Invalid UUID'),
    validate
];

const paginationQuery = [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
    query('category_id').optional().isInt().toInt(),
    query('sort_by').optional().isIn(['name', 'price', 'created_at']),
    query('sort_order').optional().isIn(['asc', 'desc']),
    query('min_price').optional().isFloat({ min: 0 }).toFloat(),
    query('max_price').optional().isFloat({ min: 0 }).toFloat(),
    validate
];

const userUpdateValidation = [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('role').optional().isIn(['admin', 'customer']).withMessage('Role must be admin or customer'),
    body('is_active').optional().isBoolean(),
    validate
];

module.exports = {
    validate,
    loginValidation,
    registerValidation,
    productValidation,
    productUpdateValidation,
    categoryValidation,
    uuidParam,
    paginationQuery,
    userUpdateValidation
};
