export async function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const errorData = error as { error?: string };
    if (typeof errorData.error === 'string') {
      return errorData.error;
    }
  }
  
  return fallback;
}
