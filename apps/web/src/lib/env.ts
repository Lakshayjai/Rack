/**
 * Single typed accessor for public environment variables.
 * Never read `process.env` directly elsewhere in the web app.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3005",
} as const;
