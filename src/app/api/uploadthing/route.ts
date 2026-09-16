import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    // Explicit so Turbopack/dotenv quirks don't leave the SDK with an empty token.
    token: process.env.UPLOADTHING_TOKEN,
  },
});
