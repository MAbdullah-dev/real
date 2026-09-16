import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { auth } from "@/auth";

const f = createUploadthing();

export const uploadRouter = {
  propertyImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 12 },
  })
    .middleware(async () => {
      const session = await auth();
      const role = session?.user?.role;
      if (!session?.user?.id || (role !== "BROKER" && role !== "AGENCY" && role !== "SELLER" && role !== "ADMIN")) {
        throw new UploadThingError("Only sellers, brokers, and agencies can upload listing photos.");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  avatar: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) {
        throw new UploadThingError("Sign in to change your photo.");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
  credentialDoc: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      const role = session?.user?.role;
      if (!session?.user?.id || (role !== "AGENCY" && role !== "ADMIN")) {
        throw new UploadThingError("Only agencies can upload credentials.");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

/** True only when the env value looks like a real UploadThing v7 token (base64 JSON). */
export function isUploadThingToken(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    const parsed = JSON.parse(Buffer.from(value.trim(), "base64").toString("utf8")) as {
      apiKey?: unknown;
      appId?: unknown;
      regions?: unknown;
    };
    return (
      typeof parsed.apiKey === "string" &&
      typeof parsed.appId === "string" &&
      Array.isArray(parsed.regions) &&
      parsed.regions.every((r) => typeof r === "string")
    );
  } catch {
    return false;
  }
}

export const uploadsConfigured = isUploadThingToken(process.env.UPLOADTHING_TOKEN);
