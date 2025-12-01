const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return errorResponse(res, 'File too large. Maximum size is 5MB', 400);
        }
        return errorResponse(res, err.message, 400);
    }

    if (err.message && err.message.includes('Invalid file type')) {
        return errorResponse(res, err.message, 400);
    }

    if (err.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 'Duplicate entry found', 409);
    }

    return errorResponse(res, err.message || 'Internal server error', 500);
};

const notFound = (req, res) => {
    return errorResponse(res, 'Route not found', 404);
};

module.exports = { errorHandler, notFound };
