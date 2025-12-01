const User = require('../models/User');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// Super Admin: Get All Users (Admins and Customers)
const getUsers = async (req, res, next) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            role: req.query.role,
            search: req.query.search,
            excludeRole: 'super_admin'
        };

        const result = await User.findAll(options);
        
        return paginatedResponse(res, result.users, {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        }, 'Users retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Get Admins
const getAdmins = async (req, res, next) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            role: 'admin',
            search: req.query.search
        };

        const result = await User.findAll(options);
        
        return paginatedResponse(res, result.users, {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        }, 'Admins retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Get Customers
const getCustomers = async (req, res, next) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            role: 'customer',
            search: req.query.search
        };

        const result = await User.findAll(options);
        
        return paginatedResponse(res, result.users, {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        }, 'Customers retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Get User by UUID
const getUserByUuid = async (req, res, next) => {
    try {
        const user = await User.findByUuid(req.params.uuid);
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        if (user.role === 'super_admin') {
            return errorResponse(res, 'Access denied', 403);
        }

        return successResponse(res, { user }, 'User retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Update User (Change role, activate/deactivate)
const updateUser = async (req, res, next) => {
    try {
        const existingUser = await User.findByUuid(req.params.uuid);
        
        if (!existingUser) {
            return errorResponse(res, 'User not found', 404);
        }

        if (existingUser.role === 'super_admin') {
            return errorResponse(res, 'Cannot modify super admin', 403);
        }

        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.role && ['admin', 'customer'].includes(req.body.role)) {
            updateData.role = req.body.role;
        }
        if (typeof req.body.is_active === 'boolean') {
            updateData.is_active = req.body.is_active;
        }

        const user = await User.update(req.params.uuid, updateData);

        return successResponse(res, { user }, 'User updated successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Promote Customer to Admin
const promoteToAdmin = async (req, res, next) => {
    try {
        const user = await User.findByUuid(req.params.uuid);
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        if (user.role !== 'customer') {
            return errorResponse(res, 'User is not a customer', 400);
        }

        const updatedUser = await User.update(req.params.uuid, { role: 'admin' });

        return successResponse(res, { user: updatedUser }, 'User promoted to admin successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Demote Admin to Customer
const demoteToCustomer = async (req, res, next) => {
    try {
        const user = await User.findByUuid(req.params.uuid);
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        if (user.role !== 'admin') {
            return errorResponse(res, 'User is not an admin', 400);
        }

        const updatedUser = await User.update(req.params.uuid, { role: 'customer' });

        return successResponse(res, { user: updatedUser }, 'Admin demoted to customer successfully');
    } catch (error) {
        next(error);
    }
};

// Super Admin: Delete User
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByUuid(req.params.uuid);
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        if (user.role === 'super_admin') {
            return errorResponse(res, 'Cannot delete super admin', 403);
        }

        await User.delete(req.params.uuid);

        return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getAdmins,
    getCustomers,
    getUserByUuid,
    updateUser,
    promoteToAdmin,
    demoteToCustomer,
    deleteUser
};
