"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/providers";
import { useNotification } from "./NotificationProvider";
import { apiRequest } from "../lib/api";
import { ALLOWED_IMAGE_TYPES, formatRent, imageUrl, MAX_IMAGE_SIZE, MAX_IMAGES } from "../lib/properties";
import MapPicker from "./MapPicker";

const emptyForm = {
  title: "",
  description: "",
  addressLine1: "",
  city: "",
  postcode: "",
  pricePerMonth: "",
  bedrooms: "1",
  bathrooms: "1",
  propertyType: "flat",
  availability: "available",
  latitude: "",
  longitude: ""
};

const propertyTypes = [
  { label: "Flat", value: "flat" },
  { label: "House", value: "house" },
  { label: "Studio", value: "studio" },
  { label: "Room", value: "room" },
  { label: "Bungalow", value: "bungalow" },
  { label: "Maisonette", value: "maisonette" }
];

function propertyToForm(property) {
  return {
    title: property.title || "",
    description: property.description || "",
    addressLine1: property.addressLine1 || "",
    city: property.city || "",
    postcode: property.postcode || "",
    pricePerMonth: String(property.pricePerMonth || ""),
    bedrooms: String(property.bedrooms ?? "1"),
    bathrooms: String(property.bathrooms ?? "1"),
    propertyType: property.propertyType || "flat",
    availability: property.availability || "available",
    latitude: property.latitude ? String(property.latitude) : "",
    longitude: property.longitude ? String(property.longitude) : ""
  };
}

function buildListingFormData(form, images, imagesToDelete = []) {
  const formData = new FormData();

  Object.entries(form).forEach(([key, value]) => {
    if (value !== "") {
      formData.append(key, value);
    }
  });

  if (imagesToDelete.length > 0) {
    formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
  }

  Array.from(images || []).forEach((image) => {
    formData.append("images", image);
  });

  return formData;
}

export default function LandlordListings() {
  const { token } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [editingProperty, setEditingProperty] = useState(null);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState([]);
  const [fileError, setFileError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState([]);

  const formTitle = editingProperty ? "Edit listing" : "Create listing";
  const sortedProperties = useMemo(() => properties, [properties]);
  const remainingExisting = existingImages.filter(
    (img) => !imagesToDelete.includes(img.filename)
  );

  async function loadProperties() {
    setIsLoading(true);
    setError("");
    setErrorDetails([]);

    try {
      const payload = await apiRequest("/api/properties/mine", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProperties(payload.data.properties);
    } catch (loadError) {
      setError(loadError.message);
      setErrorDetails(loadError.details || []);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadProperties();
    }
  }, [token]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    setFileError("");

    const invalidType = files.find((f) => !ALLOWED_IMAGE_TYPES.has(f.type));
    if (invalidType) {
      setFileError(`"${invalidType.name}" is not a valid image. Only JPG, PNG, and WEBP are allowed.`);
      event.target.value = "";
      return;
    }

    const oversized = files.find((f) => f.size > MAX_IMAGE_SIZE);
    if (oversized) {
      setFileError(`"${oversized.name}" exceeds the 5 MB size limit.`);
      event.target.value = "";
      return;
    }

    if (files.length > MAX_IMAGES) {
      setFileError(`You can upload a maximum of ${MAX_IMAGES} images at once.`);
      event.target.value = "";
      return;
    }

    setImages(files);
  }

  function resetForm() {
    setForm(emptyForm);
    setImages([]);
    setExistingImages([]);
    setImagesToDelete([]);
    setEditingProperty(null);
    setFileError("");
  }

  function startEditing(property) {
    setEditingProperty(property);
    setForm(propertyToForm(property));
    setImages([]);
    setExistingImages(property.images || []);
    setImagesToDelete([]);
    setError("");
    setErrorDetails([]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setErrorDetails([]);
    setIsSubmitting(true);

    try {
      const path = editingProperty
        ? `/api/properties/${editingProperty._id}`
        : "/api/properties";
      const method = editingProperty ? "PATCH" : "POST";
      const payload = await apiRequest(path, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: buildListingFormData(form, images, imagesToDelete)
      });

      showSuccess(payload.message || "Listing saved.");
      resetForm();
      await loadProperties();
    } catch (submissionError) {
      setError(submissionError.message);
      setErrorDetails(submissionError.details || []);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateAvailability(property, availability) {
    setError("");
    setErrorDetails([]);

    try {
      await apiRequest(`/api/properties/${property._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: buildListingFormData({ availability }, [])
      });
      showSuccess("Availability updated.");
      await loadProperties();
    } catch (updateError) {
      setError(updateError.message);
      setErrorDetails(updateError.details || []);
    }
  }

  async function deleteProperty(property) {
    const confirmed = window.confirm(`Delete "${property.title}"?`);

    if (!confirmed) {
      return;
    }

    setError("");
    setErrorDetails([]);

    try {
      await apiRequest(`/api/properties/${property._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showSuccess("Listing deleted.");

      if (editingProperty?._id === property._id) {
        resetForm();
      }

      await loadProperties();
    } catch (deleteError) {
      setError(deleteError.message);
      setErrorDetails(deleteError.details || []);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <form
        className="flex flex-col gap-4 rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-950">{formTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Add the details tenants need to judge the property quickly.
            </p>
          </div>
          {editingProperty ? (
            <button
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:border-teal-700 hover:bg-teal-50"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Title
          <input
            className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            name="title"
            onChange={updateField}
            required
            value={form.title}
          />
          <span className="text-xs font-normal text-stone-500">
            Minimum 5 characters.
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Description
          <textarea
            className="min-h-28 rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
            name="description"
            onChange={updateField}
            required
            value={form.description}
          />
          <span className="text-xs font-normal text-stone-500">
            Minimum 20 characters.
          </span>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
            Address
            <input
              className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
              name="addressLine1"
              onChange={updateField}
              required
              value={form.addressLine1}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
            City
            <input
              className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
              name="city"
              onChange={updateField}
              required
              value={form.city}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
            Postcode
            <input
              className="rounded-md border border-stone-300 px-3 py-2.5 uppercase outline-none focus:border-teal-700"
              name="postcode"
              onChange={updateField}
              required
              value={form.postcode}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
            Type
            <select
              className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
              name="propertyType"
              onChange={updateField}
              value={form.propertyType}
            >
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
            Rent
            <input
              className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
              min="1"
              name="pricePerMonth"
              onChange={updateField}
              required
              type="number"
              value={form.pricePerMonth}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
            Bedrooms
            <input
              className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
              min="0"
              name="bedrooms"
              onChange={updateField}
              required
              type="number"
              value={form.bedrooms}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
            Bathrooms
            <input
              className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
              min="0"
              name="bathrooms"
              onChange={updateField}
              required
              type="number"
              value={form.bathrooms}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
            Availability
            <select
              className="rounded-md border border-stone-300 px-3 py-2.5 outline-none focus:border-teal-700"
              name="availability"
              onChange={updateField}
              value={form.availability}
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-stone-800">Location on map</span>
          <p className="text-xs font-normal text-stone-500">
            Type an address to search, or click/drag the marker on the map.
          </p>
          <div className="mt-1">
            <MapPicker
              latitude={form.latitude ? parseFloat(form.latitude) : null}
              longitude={form.longitude ? parseFloat(form.longitude) : null}
              onCoordinatesChange={(lat, lng) => {
                setForm((current) => ({
                  ...current,
                  latitude: lat,
                  longitude: lng
                }));
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-stone-500">
            <span>
              Latitude: {form.latitude || "—"}
            </span>
            <span>
              Longitude: {form.longitude || "—"}
            </span>
          </div>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-800">
          Images
          <input
            accept="image/jpeg,image/png,image/webp"
            className="rounded-md border border-dashed border-teal-300 bg-teal-50/40 px-3 py-3 text-sm"
            multiple
            onChange={handleFileChange}
            type="file"
          />
          <span className="text-xs font-normal text-stone-500">
            JPG, PNG, or WEBP only. Maximum 8 images, 5MB each.
          </span>
          {fileError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {fileError}
            </p>
          ) : null}
        </label>

        {/* Existing images gallery (edit mode only) */}
        {remainingExisting.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-stone-800">Current images</span>
            <div className="grid grid-cols-3 gap-2">
              {remainingExisting.map((img) => (
                <div className="group relative overflow-hidden rounded-md border border-stone-200" key={img.filename}>
                  <img
                    alt={img.originalName}
                    className="h-20 w-full object-cover"
                    src={imageUrl(img)}
                  />
                  <button
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-700"
                    onClick={() =>
                      setImagesToDelete((prev) => [...prev, img.filename])
                    }
                    title="Remove this image"
                    type="button"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {imagesToDelete.length > 0 ? (
              <p className="text-xs text-red-600">
                {imagesToDelete.length} image{imagesToDelete.length === 1 ? "" : "s"} will be removed on save.
              </p>
            ) : null}
          </div>
        ) : null}

        {imagesToDelete.length > 0 && remainingExisting.length === 0 && existingImages.length > 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            All existing images marked for deletion.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p className="font-semibold">{error}</p>
            {errorDetails.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errorDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <button
          className="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving..." : editingProperty ? "Save changes" : "Create listing"}
        </button>
      </form>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-950">Your listings</h2>
            <p className="mt-1 text-sm text-stone-600">
              {properties.length} listing{properties.length === 1 ? "" : "s"} in your account.
            </p>
          </div>
          <button
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700 hover:bg-teal-50"
            onClick={loadProperties}
            type="button"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-md border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
            Loading listings...
          </div>
        ) : null}

        {!isLoading && sortedProperties.length === 0 ? (
          <div className="rounded-md border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
            No listings yet. Create your first property using the form.
          </div>
        ) : null}

        <div className="grid gap-4">
          {sortedProperties.map((property) => (
            <article
              className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg shadow-stone-200/60"
              key={property._id}
            >
              {property.images?.[0] ? (
                <img
                  alt=""
                  className="h-52 w-full object-cover"
                  src={imageUrl(property.images[0])}
                />
              ) : (
                <div className="flex h-32 items-center justify-center bg-stone-100 text-sm text-stone-500">
                  No image uploaded
                </div>
              )}

              <div className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-stone-950">{property.title}</h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {property.addressLine1}, {property.city}, {property.postcode}
                    </p>
                  </div>
                  <span className="w-fit rounded-md bg-stone-100 px-3 py-1 text-xs font-semibold uppercase text-stone-700">
                    {property.availability}
                  </span>
                </div>

                <p className="line-clamp-3 text-sm leading-6 text-stone-700">
                  {property.description}
                </p>

                <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-4">
                  <span className="rounded-md bg-stone-50 px-3 py-2">
                    {formatRent(property.pricePerMonth)}
                  </span>
                  <span className="rounded-md bg-stone-50 px-3 py-2">
                    {property.bedrooms} bed{property.bedrooms === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-md bg-stone-50 px-3 py-2">
                    {property.bathrooms} bath{property.bathrooms === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-md bg-stone-50 px-3 py-2 capitalize">
                    {property.propertyType}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                    onClick={() => startEditing(property)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100"
                    onClick={() =>
                      updateAvailability(
                        property,
                        property.availability === "available" ? "unavailable" : "available"
                      )
                    }
                    type="button"
                  >
                    Mark {property.availability === "available" ? "unavailable" : "available"}
                  </button>
                  <button
                    className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => deleteProperty(property)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
