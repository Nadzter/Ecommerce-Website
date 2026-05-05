import type { FastifyError, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }

    if (error instanceof ZodError) {
      reply.code(400).send({
        error: {
          code: 'validation_error',
          message: 'Request validation failed.',
          details: error.flatten(),
        },
      });
      return;
    }

    if (error.statusCode && error.statusCode < 500) {
      reply.code(error.statusCode).send({
        error: { code: error.code ?? 'bad_request', message: error.message },
      });
      return;
    }

    request.log.error({ err: error }, 'unhandled error');
    reply.code(500).send({
      error: { code: 'internal_error', message: 'An unexpected error occurred.' },
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: { code: 'not_found', message: 'Route not found.' } });
  });
};

export default fp(errorHandlerPlugin, { name: 'error-handler' });
