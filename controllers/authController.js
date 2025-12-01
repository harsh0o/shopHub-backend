const User = require('../models/User');
const Token = require('../models/Token');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');

// Login API
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return errorResponse(res, 'Invalid email or password', 401);
        }

        if (!user.is_active) {
            return errorResponse(res, 'Account is deactivated', 401);
        }

        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            return errorResponse(res, 'Invalid email or password', 401);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        
        await Token.saveRefreshToken(user.id, refreshToken, getRefreshTokenExpiry());

        return successResponse(res, {
            user: {
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role
            },
            accessToken,
            refreshToken
        }, 'Login successful');
    } catch (error) {
        next(error);
    }
};

// Register API
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return errorResponse(res, 'Email already registered', 409);
        }

        const { id, uuid } = await User.create({ name, email, password, role: 'customer' });
        const user = await User.findById(id);

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        
        await Token.saveRefreshToken(id, refreshToken, getRefreshTokenExpiry());

        return successResponse(res, {
            user: {
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role
            },
            accessToken,
            refreshToken
        }, 'Registration successful', 201);
    } catch (error) {
        next(error);
    }
};

// Refresh Token API
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return errorResponse(res, 'Refresh token required', 400);
        }

        const storedToken = await Token.findRefreshToken(token);
        if (!storedToken) {
            return errorResponse(res, 'Invalid or expired refresh token', 401);
        }

        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded.id);

        if (!user || !user.is_active) {
            await Token.deleteRefreshToken(token);
            return errorResponse(res, 'User not found or inactive', 401);
        }

        await Token.deleteRefreshToken(token);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        await Token.saveRefreshToken(user.id, newRefreshToken, getRefreshTokenExpiry());

        return successResponse(res, {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }, 'Token refreshed successfully');
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return errorResponse(res, 'Invalid or expired refresh token', 401);
        }
        next(error);
    }
};

// Logout API
const logout = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;
        
        if (token) {
            await Token.deleteRefreshToken(token);
        }

        return successResponse(res, null, 'Logout successful');
    } catch (error) {
        next(error);
    }
};

// Get Current User API
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        return successResponse(res, { user });
    } catch (error) {
        next(error);
    }
};

module.exports = { login, register, refreshToken, logout, getMe };
