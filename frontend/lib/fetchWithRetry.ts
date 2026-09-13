const DEFAULT_RETRYABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 502, 503, 504]);

export interface FetchRetryOptions {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryableMethods?: string[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeMethod(method?: string): string {
  return (method || "GET").toUpperCase();
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    error.name === "TypeError" ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("econnrefused") ||
    message.includes("connection refused") ||
    message.includes("timed out") ||
    message.includes("socket")
  );
}

function isRetryableResponse(response: Response): boolean {
  return RETRYABLE_STATUS_CODES.has(response.status);
}

function computeDelayMs(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffFactor: number
): number {
  return Math.min(initialDelayMs * Math.pow(backoffFactor, attempt), maxDelayMs);
}

export async function fetchWithRetry(
  input: string | URL | Request,
  init: RequestInit = {},
  options: FetchRetryOptions = {}
): Promise<Response> {
  const retries = options.retries ?? 0;
  const initialDelayMs = options.initialDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 5000;
  const backoffFactor = options.backoffFactor ?? 2;
  const retryableMethods = new Set(
    (options.retryableMethods ?? Array.from(DEFAULT_RETRYABLE_METHODS)).map((method) =>
      method.toUpperCase()
    )
  );

  const method = normalizeMethod(init.method);
  const canRetry = retryableMethods.has(method);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, init);

      if (!canRetry || !isRetryableResponse(response) || attempt === retries) {
        return response;
      }
    } catch (error) {
      if (!canRetry || !isRetryableError(error) || attempt === retries) {
        throw error;
      }
    }

    await delay(computeDelayMs(attempt, initialDelayMs, maxDelayMs, backoffFactor));
  }

  throw new Error("fetchWithRetry exhausted retries");
}
