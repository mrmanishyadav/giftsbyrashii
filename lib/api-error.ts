type ErrorLike = {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
};

export function apiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const value = error as ErrorLike;
    if (typeof value.message === 'string' && value.message) return value.message;
    if (typeof value.details === 'string' && value.details) return value.details;
    if (typeof value.hint === 'string' && value.hint) return value.hint;
  }
  return fallback;
}
