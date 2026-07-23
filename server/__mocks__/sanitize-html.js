// Manual mock for sanitize-html
// Jest cannot require the real ESM module synchronously on this Node version.
// This file uses CommonJS because moduleNameMapper resolves via CJS resolver.
function sanitizeHtml(input, options) {
  if (typeof input !== "string") {
    return "";
  }
  return input;
}

module.exports = sanitizeHtml;
module.exports.default = sanitizeHtml;