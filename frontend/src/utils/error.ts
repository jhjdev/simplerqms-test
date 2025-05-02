export function handleError(error: unknown) {
  const errorObject = error as Error;
  console.error('[Client Error]', {
    message: errorObject?.message || String(error),
    stack: errorObject?.stack,
    type: errorObject?.constructor?.name || typeof error
  });
}
