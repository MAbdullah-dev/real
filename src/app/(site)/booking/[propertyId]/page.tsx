import { BookingForm } from "./booking-form";
import { getPropertyById, listPublishedPropertyParams } from "@/server/properties";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const properties = await listPublishedPropertyParams();
  return properties.map(({ id }) => ({ propertyId: id }));
}

export default async function BookingFlowPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const property = await getPropertyById(propertyId);
  if (!property) notFound();

  return <BookingForm property={property} />;
}
