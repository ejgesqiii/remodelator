const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

type ErrorEnvelope = {
  detail?: unknown;
  error?: {
    code?: string;
    message?: string;
    status?: number;
  };
  request_id?: string;
};

function extractErrorMessage(payload: ErrorEnvelope, fallbackStatus: number): string {
  const envelopeMessage = payload.error?.message?.trim();
  if (envelopeMessage) {
    return envelopeMessage;
  }

  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }

  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    const first = payload.detail[0] as { msg?: string } | undefined;
    if (first?.msg) {
      return `Validation failed: ${first.msg}`;
    }
    return "Validation failed.";
  }

  return `HTTP ${fallbackStatus}`;
}

function withRequestId(message: string, requestId: string | undefined): string {
  const id = requestId?.trim();
  if (!id) {
    return message;
  }
  return `${message} (request_id: ${id})`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as ErrorEnvelope;
      message = withRequestId(extractErrorMessage(payload, response.status), payload.request_id);
    } catch {
      // Keep fallback error message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
