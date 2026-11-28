export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;

  const apiError = error as {
    data?: { statusMessage?: unknown; message?: unknown } | null;
    statusMessage?: unknown;
    message?: unknown;
  };

  const message =
    apiError.data?.statusMessage ??
    apiError.data?.message ??
    apiError.statusMessage ??
    apiError.message;

  return typeof message === "string" && message.length > 0 ? message : fallback;
}
