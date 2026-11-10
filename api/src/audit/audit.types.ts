import type { z } from 'zod';
import { auditQuerySchema } from '@plaza/shared';

export type AuditQueryInput = z.infer<typeof auditQuerySchema>;
