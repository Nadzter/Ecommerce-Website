import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/**
 * Uniform JSON envelope returned by every API route. Discriminated union on
 * the `success` flag so callers can pattern-match cleanly.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiErrorBody };

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Thrown by API handlers to short-circuit with a structured error. The
 * outer `withApi` wrapper converts the throw into a JSON response.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Convenience helpers for the most common error codes.
 */
export const ApiErrors = {
  badRequest: (message: string, details?: unknown): ApiError =>
    new ApiError(400, "BAD_REQUEST", message, details),
  unauthorized: (message = "Authentication required"): ApiError =>
    new ApiError(401, "UNAUTHORIZED", message),
  forbidden: (message = "You do not have access to this resource"): ApiError =>
    new ApiError(403, "FORBIDDEN", message),
  notFound: (message = "Resource not found"): ApiError =>
    new ApiError(404, "NOT_FOUND", message),
  conflict: (message: string, details?: unknown): ApiError =>
    new ApiError(409, "CONFLICT", message, details),
  unprocessable: (message: string, details?: unknown): ApiError =>
    new ApiError(422, "UNPROCESSABLE", message, details),
};

/**
 * Build a 200 OK JSON response with the success envelope.
 */
export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  const body: ApiResponse<T> = { success: true, data };
  return NextResponse.json(body, init);
}

/**
 * Build a JSON response carrying an `ApiError`.
 */
export function fail(error: ApiError): NextResponse {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    },
  };
  return NextResponse.json(body, { status: error.status });
}

/**
 * Wrap an async handler so that:
 *
 *  • `ApiError` throws become structured JSON responses.
 *  • `ZodError` throws become 400 BAD_REQUEST with field details.
 *  • Anything else is logged and returned as 500.
 */
export function withApi<T>(
  handler: () => Promise<NextResponse | T>,
): Promise<NextResponse> {
  return handler()
    .then((value) => {
      if (value instanceof NextResponse) return value;
      return ok(value);
    })
    .catch((error) => {
      if (error instanceof ApiError) return fail(error);
      if (error instanceof ZodError) {
        return fail(
          new ApiError(400, "BAD_REQUEST", "Invalid request body", {
            issues: error.flatten(),
          }),
        );
      }
      console.error("[api] unhandled error", error);
      return fail(new ApiError(500, "INTERNAL", "Something went wrong"));
    });
}

/**
 * Parse a `Request` JSON body against a Zod schema, raising
 * `ApiErrors.badRequest` when the payload is missing or malformed.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw ApiErrors.badRequest("Request body must be valid JSON");
  }
  return schema.parse(raw);
}
