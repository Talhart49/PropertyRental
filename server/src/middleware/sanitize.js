import sanitizeHtml from "sanitize-html";

/**
 * Default sanitization options.
 * Strips all HTML tags by default to prevent XSS.
 */
const defaultOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
  allowedSchemes: [],
  allowProtocolRelative: false
};

/**
 * Sanitize a single string value (strip all HTML).
 * Returns the original value if it's not a string.
 */
export function sanitize(value) {
  if (typeof value !== "string") {
    return value;
  }

  return sanitizeHtml(value, defaultOptions).trim();
}

/**
 * Recursively sanitize all string fields in an object.
 * Handles nested objects and arrays.
 */
export function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitize(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Express middleware that sanitizes all string fields on req.body.
 * Protects against XSS attacks via HTML/script injection.
 */
export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  next();
}

/**
 * Express middleware that sanitizes specific named fields on req.body.
 * Use this when you only want to sanitize certain fields (e.g., text inputs)
 * and leave others untouched (e.g., numeric fields, IDs).
 *
 * @param  {...string} fieldNames - The field names to sanitize.
 * @returns {Function} Express middleware
 */
export function sanitizeFields(...fieldNames) {
  return (req, _res, next) => {
    if (req.body && typeof req.body === "object") {
      for (const field of fieldNames) {
        if (typeof req.body[field] === "string") {
          req.body[field] = sanitize(req.body[field]);
        }
      }
    }

    next();
  };
}