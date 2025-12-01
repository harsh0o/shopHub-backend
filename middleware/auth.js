const { verifyAccessToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const { getPool } = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 'Access token required', 401);
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        
        const pool = getPool();
        const [users] = await pool.query(
            'SELECT id, uuid, name, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.id]
        );
        
        if (users.length === 0) {
            return errorResponse(res, 'User not found or inactive', 401);
        }
        
        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return errorResponse(res, 'Token expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            return errorResponse(res, 'Invalid token', 401);
        }
        return errorResponse(res, 'Authentication failed', 401);
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }
        
        if (!roles.includes(req.user.role)) {
            return errorResponse(res, 'Access denied. Insufficient permissions', 403);
        }
        
        next();
    };
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        
        const pool = getPool();
        const [users] = await pool.query(
            'SELECT id, uuid, name, email, role, is_active FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.id]
        );
        
        if (users.length > 0) {
            req.user = users[0];
        }
        
        next();
    } catch (error) {
        next();
    }
};

module.exports = { authenticate, authorize, optionalAuth };
