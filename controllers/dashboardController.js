const { getPool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Admin/Super Admin: Get Dashboard Stats
const getDashboardStats = async (req, res, next) => {
    try {
        const pool = getPool();
        let stats = {};

        if (req.user.role === 'super_admin') {
            const [totalProducts] = await pool.query('SELECT COUNT(*) as count FROM products');
            const [totalCategories] = await pool.query('SELECT COUNT(*) as count FROM categories');
            const [totalAdmins] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
            const [totalCustomers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
            const [recentProducts] = await pool.query(
                `SELECT p.uuid, p.name, p.price, p.created_at, u.name as created_by_name 
                 FROM products p 
                 LEFT JOIN users u ON p.created_by = u.id 
                 ORDER BY p.created_at DESC LIMIT 5`
            );

            stats = {
                totalProducts: totalProducts[0].count,
                totalCategories: totalCategories[0].count,
                totalAdmins: totalAdmins[0].count,
                totalCustomers: totalCustomers[0].count,
                recentProducts
            };
        } else if (req.user.role === 'admin') {
            const [myProducts] = await pool.query(
                'SELECT COUNT(*) as count FROM products WHERE created_by = ?',
                [req.user.id]
            );
            const [totalCategories] = await pool.query('SELECT COUNT(*) as count FROM categories WHERE is_active = TRUE');
            const [recentProducts] = await pool.query(
                `SELECT uuid, name, price, created_at 
                 FROM products WHERE created_by = ? 
                 ORDER BY created_at DESC LIMIT 5`,
                [req.user.id]
            );

            stats = {
                myProducts: myProducts[0].count,
                totalCategories: totalCategories[0].count,
                recentProducts
            };
        } else {
            return errorResponse(res, 'Access denied', 403);
        }

        return successResponse(res, { stats }, 'Dashboard stats retrieved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };
