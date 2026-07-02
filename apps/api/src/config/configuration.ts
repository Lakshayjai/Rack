/**
 * Single typed source of truth for environment configuration.
 * Access config only through this factory / the ConfigService — never `process.env` elsewhere.
 */
export interface AppConfig {
  port: number;
  webOrigin: string;
  /** Public base URL of this API, used to build local upload URLs. */
  publicApiUrl: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  rembg: {
    url: string;
    removeBgApiKey: string;
  };
}

/** Reads and normalizes environment variables into a typed config object. */
export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3005', 10),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  publicApiUrl:
    process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? '3005'}`,
  jwt: {
    secret: process.env.JWT_SECRET ?? 'insecure-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
  rembg: {
    url: process.env.REMBG_URL ?? 'http://localhost:7000/remove',
    removeBgApiKey: process.env.REMOVE_BG_API_KEY ?? '',
  },
});
