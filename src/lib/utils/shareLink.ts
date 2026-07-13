import { sign } from "@/lib/jwt";

export async function generateShareLink(params: {
  originPincode: string;
  destPincode: string;
  weight: number;
  weightUnit: string;
  commodityCode: string;
  vehicleAxles: string;
  containerType: string;
  incoterm: string;
}): Promise<string> {
  const secret = process.env.NEXT_PUBLIC_JWT_SECRET || "freight-secret-key-2026";
  
  // Set expiration to 7 days (7 * 24 * 60 = 10,080 minutes)
  const token = await sign(
    {
      ...params,
      type: "share-link"
    },
    secret,
    10080
  );

  // Return absolute or relative link
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    return `${origin}/calculate?share=${token}`;
  }
  
  return `/calculate?share=${token}`;
}
