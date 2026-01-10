// Email validation using regex
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password validation - minimum 8 characters
export const isValidPassword = (password) => {
    return password && password.length >= 8;
};

// Sanitize input to prevent injection
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim();
};

// Validate registration input
export const validateRegisterInput = (name, email, password) => {
    const errors = [];

    if (!name || name.trim().length === 0) {
        errors.push('Name is required');
    }

    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }

    if (!password || !isValidPassword(password)) {
        errors.push('Password must be at least 8 characters');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Validate login input
export const validateLoginInput = (email, password) => {
    const errors = [];

    if (!email || !isValidEmail(email)) {
        errors.push('Valid email is required');
    }

    if (!password || password.trim().length === 0) {
        errors.push('Password is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
