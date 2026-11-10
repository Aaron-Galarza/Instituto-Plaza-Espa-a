import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './errors';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('API');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = 500;
    let body: ErrorBody = {
      error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno inesperado.' },
    };

    if (exception instanceof AppError) {
      status = exception.status;
      body = {
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.details !== undefined ? { details: exception.details } : {}),
        },
      };
    } else if (exception instanceof ZodError) {
      status = 422;
      body = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Revisá los datos ingresados.',
          details: exception.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      };
    } else if (exception instanceof HttpException) {
      const response = exception.getResponse();
      status = exception.getStatus();
      body = {
        error: {
          code: status === 404 ? 'NOT_FOUND' : status === 401 ? 'UNAUTHENTICATED' : 'HTTP_ERROR',
          message:
            typeof response === 'string'
              ? response
              : ((response as { message?: string }).message ?? exception.message),
        },
      };
    } else if (typeof exception === 'object' && exception !== null && 'statusCode' in exception) {
      const fastifyError = exception as { statusCode: number; message?: string; code?: string };
      status = fastifyError.statusCode;
      body = {
        error: {
          code: fastifyError.code ?? 'HTTP_ERROR',
          message: fastifyError.message ?? 'Error en la solicitud',
        },
      };
    } else {
      this.logger.error(
        `Error no controlado: ${exception instanceof Error ? exception.stack : String(exception)}`,
      );
    }

    if (status >= 500) {
      this.logger.error(
        `[${request?.id ?? '-'}] ${request?.method ?? ''} ${request?.url ?? ''} -> ${status}`,
      );
    }

    if (request?.id) body.requestId = String(request.id);
    reply.status(status).send(body);
  }
}
