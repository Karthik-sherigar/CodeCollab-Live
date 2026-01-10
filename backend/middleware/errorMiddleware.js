// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    if (err.stack) {
        console.error(err.stack);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        // Only include stack trace in development
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        error: err.name || 'Error'
    });
};

// Middleware for handling 404 Not Found
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
