// @ts-nocheck
import { SetMetadata } from '@nestjs/common';

export const TRIM_EXCLUDE_KEY = 'trim_exclude';

/**
 * Decorator to exclude specific fields or entire objects from being automatically trimmed
 * by the TrimRequestInterceptor.
 */
export const TrimExclude = () => SetMetadata(TRIM_EXCLUDE_KEY, true);
// @ts-nocheck
// @ts-nocheck
