import { env } from "./env";

/** Error thrown by the API client carrying the HTTP status and server message. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON body — serialized automatically. Omit for FormData (pass via `formData`). */
  body?: unknown;
  /** Raw FormData body for file uploads (sets no Content-Type so the browser adds the boundary). */
  formData?: FormData;
  /** Query params appended to the URL. */
  query?: Record<string, string | number | undefined | null>;
}

/**
 * Typed fetch wrapper for the NestJS API.
 * Always sends credentials so the HTTP-only auth cookie rides along.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, formData, query, headers, ...rest } = options;

  const url = new URL(`${env.apiUrl}/api${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const init: RequestInit = {
    ...rest,
    credentials: "include",
    headers: {
      ...(formData ? {} : body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  };
  if (formData) init.body = formData;
  else if (body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(url.toString(), init);

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (data as { message?: string | string[] }).message) || res.statusText;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(", ") : String(message));
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", formData }),
};
