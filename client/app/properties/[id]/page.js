import PropertyDetails from "../../../components/PropertyDetails";

export default async function PropertyDetailsPage({ params }) {
  const { id } = await params;

  return <PropertyDetails propertyId={id} />;
}
