/** Errors returned by the bounded JSON reader before JSON parsing starts. */
export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('request_body_too_large');
  }
}

/**
 * Reads a request body while enforcing an actual byte limit.
 *
 * Content-Length is only an early optimisation: HTTP clients may use chunked
 * transfer encoding or send an incorrect header, so the stream itself remains
 * the source of truth.
 */
export async function readLimitedJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) throw new SyntaxError('empty_request_body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
