/**
 * Fastify 통합 예제
 *
 * Fastify 서버에서 jest-swagger 플러그인을 사용하는 방법을 보여주는 예제
 */

import Fastify from 'fastify';
import { fastifySwagger, registerRoute, DocumentBuilder } from '../src';

const fastify = Fastify({
  logger: true,
});

// Swagger 문서 빌더 생성
const builder = new DocumentBuilder('Fastify API', '1.0.0')
  .setDescription('Fastify API 문서 예제')
  .addServer('http://localhost:3000', '로컬 개발 서버');

// Swagger 플러그인 등록
fastify.register(fastifySwagger, {
  builder,
  routePrefix: '/documentation',
  exposeRoute: true,
  autoCollect: true, // 자동으로 라우트 수집
  excludePaths: ['/health'], // 제외할 경로
});

// 헬스 체크 엔드포인트 (문서에서 제외됨)
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// 사용자 목록 조회
registerRoute(fastify, {
  method: 'GET',
  url: '/users',
  schema: {
    description: '사용자 목록 조회',
    tags: ['users'],
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'number', description: '페이지 번호' },
        limit: { type: 'number', description: '페이지 크기' },
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
            email: { type: 'string' },
          },
        },
      },
    },
  } as any,
  handler: async (request, reply) => {
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];
  },
});

// 사용자 조회
registerRoute(fastify, {
  method: 'GET',
  url: '/users/:id',
  schema: {
    description: '사용자 조회',
    tags: ['users'],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '사용자 ID' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
      404: {
        description: '사용자를 찾을 수 없음',
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  } as any,
  handler: async (request, reply) => {
    const { id } = request.params as any;
    return { id, name: 'John Doe', email: 'john@example.com' };
  },
});

// 사용자 생성
registerRoute(fastify, {
  method: 'POST',
  url: '/users',
  schema: {
    description: '사용자 생성',
    tags: ['users'],
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', description: '사용자 이름' },
        email: { type: 'string', format: 'email', description: '이메일 주소' },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
      400: {
        description: '잘못된 요청',
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  } as any,
  handler: async (request, reply) => {
    const body = request.body as any;
    reply.status(201);
    return { id: '3', ...body };
  },
});

// 사용자 수정
registerRoute(fastify, {
  method: 'PUT',
  url: '/users/:id',
  schema: {
    description: '사용자 수정',
    tags: ['users'],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '사용자 ID' },
      },
    },
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
    },
  } as any,
  handler: async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    return { id, ...body };
  },
});

// 사용자 삭제
registerRoute(fastify, {
  method: 'DELETE',
  url: '/users/:id',
  schema: {
    description: '사용자 삭제',
    tags: ['users'],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '사용자 ID' },
      },
    },
    response: {
      204: {
        description: '삭제됨',
        type: 'null',
      },
    },
  } as any,
  handler: async (request, reply) => {
    reply.status(204).send();
  },
});

// 서버 시작
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Server is running on port 3000');
    console.log('Swagger documentation available at:');
    console.log('- JSON: http://localhost:3000/documentation/json');
    console.log('- YAML: http://localhost:3000/documentation/yaml');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
