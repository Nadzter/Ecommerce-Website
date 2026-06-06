import type { ApiErrorBody, ApiResponse } from "./api";

/**
 * Thrown by `fetchJson` when a response envelope reports `success: false`,
 * or when the response is not valid JSON.
 */
export class FetchError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "FetchError";
  }
}

/**
 * Issue a `fetch` request and unwrap the standard {success, data, error}
 * envelope. Throws a {@link FetchError} on non-2xx responses or
 * `success: false` envelopes so React Query treats them as errors.
 */
export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let body: ApiResponse<T> | undefined;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new FetchError(response.status, {
      code: "INVALID_JSON",
      message: `Server returned ${response.status} with non-JSON body`,
    });
  }

  if (!body.success) {
    throw new FetchError(response.status, body.error);
  }
  return body.data;
}
