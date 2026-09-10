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
      if (!session?.user?.id || (role !== "AGENT" && role !== "ADMIN")) {
        throw new UploadThingError("Only agents can upload listing photos.");
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
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export const uploadsConfigured = Boolean(process.env.UPLOADTHING_TOKEN);
