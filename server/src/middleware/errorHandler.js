export function notFound(_req, res) {
  res.status(404).json({ error: "Route not found." });
}

export function errorHandler(error, _req, res, _next) {
  if (error.message === "Only JPG, PNG, and WEBP images are allowed.") {
    return res.status(400).json({ error: error.message });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Each image must be 5MB or smaller." });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ error: "A listing can include up to 8 images." });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ error: "Invalid identifier." });
  }

  if (error.name === "ValidationError") {
    const details = Object.values(error.errors).map((fieldError) => fieldError.message);
    return res.status(400).json({
      error: "Please fix the highlighted listing details.",
      details
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({ error: "A record with this value already exists." });
  }

  console.error(error);
  return res.status(500).json({ error: "Something went wrong on the server." });
}
