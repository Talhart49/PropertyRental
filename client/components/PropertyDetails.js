"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { formatRent, imageUrl } from "../lib/properties";
import PropertyMap from "./PropertyMap";
import BookingRequestForm from "./BookingRequestForm";
import MessagingPanel from "./MessagingPanel";
import SiteHeader from "./SiteHeader";


export default function PropertyDetails({ propertyId }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const gallery = useMemo(() => property?.images || [], [property]);

  useEffect(() => {
    async function loadProperty() {
      setError("");
      setIsLoading(true);

      try {
        const payload = await apiRequest(`/api/properties/${propertyId}`);
        setProperty(payload.data.property);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="rounded-md border border-stone-200 bg-white/90 px-5 py-4 text-sm font-medium text-stone-600 shadow-lg shadow-stone-200/70">
          Loading property...
        </p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error || "Property not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-stone-200 bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Property details
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-950 md:text-5xl">
              {property.title}
            </h1>
            <p className="mt-3 text-base text-stone-600">
              {property.addressLine1}, {property.city}, {property.postcode}
            </p>
          </div>
          <Link
            className="w-fit rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700 hover:bg-teal-50"
            href="/tenant"
          >
            Back to search
          </Link>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="flex flex-col gap-4">
            {gallery.length > 0 ? (
              <div className="grid gap-3">
                <img
                  alt=""
                  className="h-80 w-full rounded-md object-cover shadow-lg shadow-stone-200/70"
                  src={imageUrl(gallery[0])}
                />
                {gallery.length > 1 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {gallery.slice(1).map((image) => (
                      <img
                        alt=""
                        className="h-28 w-full rounded-md object-cover"
                        key={image.filename}
                        src={imageUrl(image)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center rounded-md bg-stone-100 text-sm text-stone-500">
                No image uploaded
              </div>
            )}

            <div className="rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60">
              <h2 className="text-xl font-bold text-stone-950">Description</h2>
              <p className="mt-3 text-sm leading-7 text-stone-700">{property.description}</p>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60">
              <h2 className="text-xl font-bold text-stone-950">Listing summary</h2>
              <div className="mt-4 grid gap-3 text-sm text-stone-700">
                <div className="rounded-md bg-stone-50 px-3 py-2">
                  {formatRent(property.pricePerMonth)}
                </div>
                <div className="rounded-md bg-stone-50 px-3 py-2">
                  {property.bedrooms} bedroom{property.bedrooms === 1 ? "" : "s"}
                </div>
                <div className="rounded-md bg-stone-50 px-3 py-2">
                  {property.bathrooms} bathroom{property.bathrooms === 1 ? "" : "s"}
                </div>
                <div className="rounded-md bg-stone-50 px-3 py-2 capitalize">
                  {property.propertyType}
                </div>
                <div className="rounded-md bg-stone-50 px-3 py-2 capitalize">
                  {property.availability}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60">
              <h2 className="text-xl font-bold text-stone-950">Landlord</h2>
              <p className="mt-3 text-sm text-stone-700">{property.landlord?.name}</p>
              <p className="mt-1 text-sm text-stone-600">{property.landlord?.email}</p>
            </div>

            <BookingRequestForm propertyId={property._id} />

            <div className="rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60">
              <h2 className="text-xl font-bold text-stone-950">Contact</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Tenants can start a direct conversation with the landlord.
              </p>
              <div className="mt-4">
                <MessagingPanel propertyId={property._id} />
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-white/95 p-5 shadow-lg shadow-stone-200/60">
              <h2 className="text-xl font-bold text-stone-950">Map</h2>
              <div className="mt-3 overflow-hidden rounded-md" style={{ height: "280px" }}>
                {property.latitude && property.longitude ? (
                  <PropertyMap
                    properties={[property]}
                    singleProperty
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-teal-200 bg-teal-50/60 p-5 text-center text-sm leading-6 text-stone-600">
                    Map preview will appear when this listing includes coordinates.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
