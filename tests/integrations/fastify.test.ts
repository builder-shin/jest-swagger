/**
 * Fastify 플러그인 테스트
 */

import Fastify, { FastifyInstance } from 'fastify';
import {
  fastifySwagger,
  FastifySwaggerOptions,
  registerRoute,
} from '../../src/integrations/fastify';
import { DocumentBuilder } from '../../src/builders/document-builder';

describe('Fastify Swagger 플러그인', () => {
  let fastify: FastifyInstance;

  beforeEach(() => {
    fastify = Fastify();
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('fastifySwagger', () => {
    it('기본 설정으로 플러그인을 등록할 수 있어야 함', async () => {
      await fastify.register(fastifySwagger);
      await fastify.ready();

      expect(fastify.hasDecorator('swagger')).toBe(true);
    });

    it('사용자 정의 DocumentBuilder를 사용할 수 있어야 함', async () => {
      const builder = new DocumentBuilder('Test API', '1.0.0')
        .setDescription('테스트 API')
        .addServer('http://localhost:3000');

      await fastify.register(fastifySwagger, { builder });
      await fastify.ready();

      expect(fastify.hasDecorator('swagger')).toBe(true);
    });

    it('사용자 정의 경로를 설정할 수 있어야 함', async () => {
      const options: FastifySwaggerOptions = {
        routePrefix: '/custom-docs',
      };

      await fastify.register(fastifySwagger, options);
      await fastify.ready();

      expect(fastify.hasDecorator('swagger')).toBe(true);
    });

    it('Swagger 문서를 JSON으로 제공해야 함', async () => {
      await fastify.register(fastifySwagger, {
        routePrefix: '/api-docs',
        exposeRoute: true,
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/api-docs/json',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const doc = JSON.parse(response.payload);
      expect(doc.openapi).toBe('3.0.0');
    });

    it('Swagger 문서를 YAML로 제공해야 함', async () => {
      await fastify.register(fastifySwagger, {
        routePrefix: '/api-docs',
        exposeRoute: true,
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/api-docs/yaml',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/yaml');
    });

    it('경로를 자동으로 수집해야 함', async () => {
      await fastify.register(fastifySwagger, {
        autoCollect: true,
      });

      // 라우트 등록
      fastify.get('/users', async () => {
        return { users: [] };
      });

      fastify.post('/users', async () => {
        return { id: 1 };
      });

      await fastify.ready();

      const doc = (fastify as any).swagger();
      expect(doc.paths['/users']).toBeDefined();
      expect(doc.paths['/users'].get).toBeDefined();
      expect(doc.paths['/users'].post).toBeDefined();
    });

    it('특정 경로를 제외할 수 있어야 함', async () => {
      await fastify.register(fastifySwagger, {
        autoCollect: true,
        excludePaths: ['/health'],
      });

      fastify.get('/health', async () => {
        return { status: 'ok' };
      });

      fastify.get('/users', async () => {
        return { users: [] };
      });

      await fastify.ready();

      const doc = (fastify as any).swagger();
      expect(doc.paths['/health']).toBeUndefined();
      expect(doc.paths['/users']).toBeDefined();
    });
  });

  describe('registerRoute', () => {
    beforeEach(async () => {
      await fastify.register(fastifySwagger);
    });

    it('라우트 스키마를 문서에 추가해야 함', async () => {
      registerRoute(fastify, {
        method: 'GET',
        url: '/users/:id',
        schema: {
          description: '사용자 조회',
          tags: ['users'],
          params: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          response: {
            200: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        } as any,
        handler: async (request, reply) => {
          return { id: '1', name: 'Test' };
        },
      });

      await fastify.ready();

      const doc = (fastify as any).swagger();
      expect(doc.paths['/users/:id']).toBeDefined();
      expect(doc.paths['/users/:id'].get).toBeDefined();
      expect(doc.paths['/users/:id'].get.tags).toContain('users');
    });

    it('여러 HTTP 메서드를 지원해야 함', async () => {
      const handler = async () => ({ ok: true });

      registerRoute(fastify, {
        method: 'GET',
        url: '/items',
        schema: { description: 'Get items' } as any,
        handler,
      });

      registerRoute(fastify, {
        method: 'POST',
        url: '/items',
        schema: { description: 'Create item' } as any,
        handler,
      });

      registerRoute(fastify, {
        method: 'PUT',
        url: '/items/:id',
        schema: { description: 'Update item' } as any,
        handler,
      });

      registerRoute(fastify, {
        method: 'DELETE',
        url: '/items/:id',
        schema: { description: 'Delete item' } as any,
        handler,
      });

      await fastify.ready();

      const doc = (fastify as any).swagger();
      expect(doc.paths['/items'].get).toBeDefined();
      expect(doc.paths['/items'].post).toBeDefined();
      expect(doc.paths['/items/:id'].put).toBeDefined();
      expect(doc.paths['/items/:id'].delete).toBeDefined();
    });

    it('요청 본문 스키마를 포함해야 함', async () => {
      registerRoute(fastify, {
        method: 'POST',
        url: '/users',
        schema: {
          description: '사용자 생성',
          body: {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
          response: {
            201: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
        } as any,
        handler: async () => ({ id: '1' }),
      });

      await fastify.ready();

      const doc = (fastify as any).swagger();
      const operation = doc.paths['/users'].post;

      expect(operation.requestBody).toBeDefined();
      expect(operation.requestBody.content['application/json'].schema).toBeDefined();
    });
  });

  describe('스키마 변환', () => {
    beforeEach(async () => {
      await fastify.register(fastifySwagger);
    });

    it('Fastify 스키마를 OpenAPI 스키마로 변환해야 함', async () => {
      registerRoute(fastify, {
        method: 'GET',
        url: '/users',
        schema: {
          querystring: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
            },
          },
          response: {
            200: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        handler: async () => [],
      });

      await fastify.ready();

      const doc = (fastify as any).swagger();
      const operation = doc.paths['/users'].get;

      expect(operation.parameters).toBeDefined();
      expect(operation.parameters.length).toBeGreaterThan(0);
      expect(operation.responses['200']).toBeDefined();
    });
  });
});
