import { AppError } from './AppError';

/**
 * Safely extract a route param as a plain string.
 * With noUncheckedIndexedAccess, req.params[key] is string | string[] | undefined.
 * This narrows it to string or throws a 400 AppError.
 */
export function requireParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string {
  const value = params[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new AppError(`Route parameter '${key}' is missing or invalid`, 400);
}
