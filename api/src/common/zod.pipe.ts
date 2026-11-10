import type { PipeTransform } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { ZodTypeAny, z } from 'zod';
import { AppError } from './errors';

@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const parsed = this.schema.safeParse(value ?? {});
    if (!parsed.success) {
      throw AppError.validation(
        'Revisá los datos ingresados.',
        parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    return parsed.data;
  }
}

/** Atajo para usar en @Body(...), @Query(...) y @Param(...) */
export function zod<T extends ZodTypeAny>(schema: T): ZodValidationPipe<T> {
  return new ZodValidationPipe(schema);
}
