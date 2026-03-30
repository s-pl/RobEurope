/**
 * Generic request body validator middleware.
 * @param {Object} schema - Object mapping field names to validation rules.
 * Each rule: { required?: boolean, type?: string, min?: number, max?: number, pattern?: RegExp, message?: string }
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: rules.message || `${field} is required` });
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    if (rules.type === 'email') {
      // Length guard before regex prevents polynomial backtracking on crafted inputs
      const str = String(value);
      if (str.length > 254 || !/^[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}\.[a-zA-Z]{2,24}$/.test(str)) {
        errors.push({ field, message: `${field} must be a valid email` });
      }
    }

    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push({ field, message: `${field} must be a string` });
    }

    if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
      errors.push({ field, message: `${field} must be a number` });
    }

    if (rules.min !== undefined && typeof value === 'string' && value.length < rules.min) {
      errors.push({ field, message: `${field} must be at least ${rules.min} characters` });
    }

    if (rules.max !== undefined && typeof value === 'string' && value.length > rules.max) {
      errors.push({ field, message: `${field} must be at most ${rules.max} characters` });
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({ field, message: rules.message || `${field} has invalid format` });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  next();
};

export default validate;
