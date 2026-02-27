/**
 * Utility to retry Supabase queries in case of transient network errors.
 */
export async function withRetry<T>(
    operation: () => Promise<{ data: T | null, error: any, count?: number | null }>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<{ data: T | null, error: any, count?: number | null }> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await operation();
            if (!result.error) return result;

            // If it's a fetch error or network error, retry
            if (result.error.message?.includes('fetch failed') ||
                result.error.message?.includes('network error') ||
                result.error.status === 502 ||
                result.error.status === 503 ||
                result.error.status === 504) {
                lastError = result.error;
                console.warn(`Supabase fetch failed. Retrying (${i + 1}/${maxRetries})...`, lastError.message);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Exponential backoffish
                continue;
            }

            // If it's a logic error (400, 401, etc.), don't retry
            return result;
        } catch (e: any) {
            lastError = e;
            console.warn(`Supabase operation threw error. Retrying (${i + 1}/${maxRetries})...`, e.message);
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }

    return { data: null, error: lastError, count: null };
}
