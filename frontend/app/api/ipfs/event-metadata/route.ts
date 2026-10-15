import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

async function uploadPublicFile(file: File, name: string) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not configured");

  const body = new FormData();
  body.append("network", "public");
  body.append("name", name);
  body.append("file", file);

  const response = await fetch("https://uploads.pinata.cloud/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  });

  if (!response.ok) throw new Error(`Pinata upload failed (${response.status})`);
  const payload = await response.json();
  const cid = payload?.data?.cid;
  if (!cid) throw new Error("Pinata response did not contain a CID");
  return cid as string;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const image = form.get("image");
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();

    if (!(image instanceof File)) return NextResponse.json({ error: "Artwork is required" }, { status: 400 });
    if (!name || name.length > 120) return NextResponse.json({ error: "Invalid event name" }, { status: 400 });
    if (!description || description.length > 1500) return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    if (!ALLOWED_IMAGE_TYPES.has(image.type)) return NextResponse.json({ error: "Unsupported artwork type" }, { status: 400 });
    if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Artwork must be 8 MB or smaller" }, { status: 400 });

    const safeName = name.replace(/[^a-zA-Z0-9-_ ]/g, "").slice(0, 60) || "event";
    const imageCid = await uploadPublicFile(image, `${safeName}-artwork`);
    const metadata = {
      name,
      description,
      image: `ipfs://${imageCid}`,
      attributes: [{ trait_type: "Credential", value: "Proof of Attendance" }],
    };
    const metadataFile = new File([JSON.stringify(metadata)], "metadata.json", { type: "application/json" });
    const metadataCid = await uploadPublicFile(metadataFile, `${safeName}-metadata`);

    return NextResponse.json({ imageURI: `ipfs://${imageCid}`, metadataURI: `ipfs://${metadataCid}` });
  } catch (error) {
    console.error("IPFS upload error", error);
    return NextResponse.json({ error: "Unable to upload event metadata" }, { status: 500 });
  }
}
