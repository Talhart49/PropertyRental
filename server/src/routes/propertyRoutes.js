import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAuth, requireRole, requireVerifiedEmail } from "../middleware/auth.js";
import { propertyImageUpload } from "../middleware/upload.js";
import Property from "../models/Property.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.resolve(__dirname, "../../uploads");

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}

function uploadedImages(files = []) {
  return files.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    url: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size
  }));
}

async function removePropertyImages(property) {
  await Promise.all(
    property.images.map((image) =>
      fs.unlink(path.join(uploadDirectory, image.filename)).catch(() => undefined)
    )
  );
}

function buildPropertyPayload(body, files) {
  const latitude = parseNumber(body.latitude);
  const longitude = parseNumber(body.longitude);

  return {
    title: body.title,
    description: body.description,
    addressLine1: body.addressLine1,
    city: body.city,
    postcode: body.postcode,
    pricePerMonth: parseNumber(body.pricePerMonth),
    bedrooms: parseNumber(body.bedrooms),
    bathrooms: parseNumber(body.bathrooms),
    propertyType: body.propertyType,
    availability: body.availability,
    latitude,
    longitude,
    images: uploadedImages(files)
  };
}

function publicSearchQuery(query) {
  const filters = {
    moderationStatus: "active"
  };

  if (query.location) {
    const locationRegex = new RegExp(query.location, "i");
    filters.$or = [
      { city: locationRegex },
      { postcode: locationRegex },
      { addressLine1: locationRegex }
    ];
  }

  if (query.propertyType) {
    filters.propertyType = query.propertyType;
  }

  if (query.availability) {
    filters.availability = query.availability;
  } else {
    filters.availability = "available";
  }

  const minPrice = parseNumber(query.minPrice);
  const maxPrice = parseNumber(query.maxPrice);

  if (minPrice !== undefined || maxPrice !== undefined) {
    filters.pricePerMonth = {};

    if (minPrice !== undefined) {
      filters.pricePerMonth.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      filters.pricePerMonth.$lte = maxPrice;
    }
  }

  const bedrooms = parseNumber(query.bedrooms);

  if (bedrooms !== undefined) {
    filters.bedrooms = { $gte: bedrooms };
  }

  // ---- Map bounding-box filter ----
  const neLat = parseNumber(query.neLat);
  const neLng = parseNumber(query.neLng);
  const swLat = parseNumber(query.swLat);
  const swLng = parseNumber(query.swLng);

  if (neLat !== undefined && neLng !== undefined && swLat !== undefined && swLng !== undefined) {
    filters.latitude = { $gte: swLat, $lte: neLat };
    filters.longitude = { $gte: swLng, $lte: neLng };
  }

  return filters;
}

router.get("/mine", requireAuth, requireVerifiedEmail, requireRole("landlord"), async (req, res, next) => {
  try {
    const properties = await Property.find({ landlord: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      data: {
        properties
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseNumber(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseNumber(req.query.limit) || 20, 1), 50);
    const skip = (page - 1) * limit;
    const filters = publicSearchQuery(req.query);

    const sortOption = req.query.sort || "newest";
    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { pricePerMonth: 1 },
      price_desc: { pricePerMonth: -1 }
    };
    const sort = sortMap[sortOption] || sortMap.newest;

    const [properties, total] = await Promise.all([
      Property.find(filters)
        .populate("landlord", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Property.countDocuments(filters)
    ]);

    res.status(200).json({
      data: {
        properties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate("landlord", "name email");

    if (!property || property.moderationStatus !== "active") {
      return res.status(404).json({ error: "Property not found." });
    }

    res.status(200).json({
      data: {
        property
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  requireAuth,
  requireVerifiedEmail,
  requireRole("landlord"),
  propertyImageUpload.array("images", 8),
  async (req, res, next) => {
    try {
      const property = await Property.create({
        ...buildPropertyPayload(req.body, req.files),
        landlord: req.user._id
      });

      res.status(201).json({
        data: {
          property
        },
        message: "Property listing created successfully."
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id",
  requireAuth,
  requireVerifiedEmail,
  requireRole("landlord"),
  propertyImageUpload.array("images", 8),
  async (req, res, next) => {
    try {
      const property = await Property.findOne({
        _id: req.params.id,
        landlord: req.user._id
      });

      if (!property) {
        return res.status(404).json({ error: "Property not found." });
      }

      const payload = buildPropertyPayload(req.body, req.files);
      const nextImages = uploadedImages(req.files);

      Object.entries(payload).forEach(([key, value]) => {
        if (key === "images") {
          return;
        }

        if (value !== undefined) {
          property[key] = value;
        }
      });

      if (nextImages.length > 0) {
        property.images.push(...nextImages);
      }

      // Handle image deletion: accept a comma-separated list of filenames or a JSON array
      let imagesToDelete = req.body.imagesToDelete;

      if (imagesToDelete) {
        if (typeof imagesToDelete === "string") {
          try {
            imagesToDelete = JSON.parse(imagesToDelete);
          } catch {
            imagesToDelete = imagesToDelete.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }

        if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
          const remainingImages = property.images.filter(
            (img) => !imagesToDelete.includes(img.filename)
          );
          const removedImages = property.images.filter((img) =>
            imagesToDelete.includes(img.filename)
          );

          property.images = remainingImages;

          // Delete the actual files from disk
          await Promise.all(
            removedImages.map((img) =>
              fs.unlink(path.join(uploadDirectory, img.filename)).catch(() => undefined)
            )
          );
        }
      }

      await property.save();

      res.status(200).json({
        data: {
          property
        },
        message: "Property listing updated successfully."
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", requireAuth, requireVerifiedEmail, requireRole("landlord"), async (req, res, next) => {
  try {
    const property = await Property.findOneAndDelete({
      _id: req.params.id,
      landlord: req.user._id
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }

    await removePropertyImages(property);

    res.status(200).json({
      data: {
        id: property._id
      },
      message: "Property listing deleted successfully."
    });
  } catch (error) {
    next(error);
  }
});

export default router;
