import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { SignJWT, jwtVerify } from 'jose';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
  interface FastifyInstance {
    auth: {
      sign(payload: AccessClaims, ttlSeconds: number): Promise<string>;
      verify(token: string): Promise<AccessClaims>;
      requireUser(request: FastifyRequest, reply: FastifyReply): Promise<AuthContext | null>;
    };
  }
}

export interface AccessClaims {
  sub: string; // user id
  sid: string; // session id
}

export interface AuthContext extends AccessClaims {
  token: string;
}

interface PluginOpts {
  secret: string;
  issuer?: string;
}

const authPlugin: FastifyPluginAsync<PluginOpts> = async (app, opts) => {
  const secretKey = new TextEncoder().encode(opts.secret);
  const issuer = opts.issuer ?? 'amwali';

  app.decorateRequest('auth', null);

  app.decorate('auth', {
    async sign(payload: AccessClaims, ttlSeconds: number): Promise<string> {
      return new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(issuer)
        .setIssuedAt()
        .setExpirationTime(`${ttlSeconds}s`)
        .sign(secretKey);
    },

    async verify(token: string): Promise<AccessClaims> {
      const { payload } = await jwtVerify(token, secretKey, { issuer });
      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
        throw new Error('invalid_token_payload');
      }
      return { sub: payload.sub, sid: payload.sid };
    },

    async requireUser(request: FastifyRequest, reply: FastifyReply): Promise<AuthContext | null> {
      const header = request.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        reply.code(401).send({
          error: { code: 'unauthorized', message: 'Missing bearer token.' },
        });
        return null;
      }
      const token = header.slice('Bearer '.length);
      try {
        const claims = await app.auth.verify(token);
        const ctx = { ...claims, token };
        request.auth = ctx;
        return ctx;
      } catch {
        reply.code(401).send({
          error: { code: 'unauthorized', message: 'Invalid or expired token.' },
        });
        return null;
      }
    },
  });
};

export default fp(authPlugin, { name: 'auth' });
