export function unwrapResponseData<T = any>(data: any, preferredKey?: string): T {
  if (!data) return [] as unknown as T;

  // Handle direct array response
  if (Array.isArray(data)) {
    return data as unknown as T;
  }

  // Handle object response with success: false
  if (data.success === false) {
    throw new Error(data.message || 'Backend request rejected.');
  }

  // Handle preferred attribute key if present
  if (preferredKey && data[preferredKey] !== undefined) {
    return data[preferredKey] as T;
  }

  // Auto-detect list array property
  const keys = Object.keys(data).filter(
    (k) => !['success', 'message', 'status', 'statusCode', 'timestamp'].includes(k)
  );

  for (const k of keys) {
    if (Array.isArray(data[k])) {
      return data[k] as unknown as T;
    }
  }

  // Fallback to first non-metadata object property or full data
  if (keys.length === 1 && typeof data[keys[0]] === 'object') {
    return data[keys[0]] as T;
  }

  return data as T;
}
