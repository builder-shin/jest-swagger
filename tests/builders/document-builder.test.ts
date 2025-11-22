/**
 * DocumentBuilder 테스트
 */

import { DocumentBuilder } from '../../src/builders/document-builder';
import {
  OpenAPIDocument,
  OperationObject,
  SchemaObject,
  ResponseObject,
} from '../../src/types/openapi.types';

describe('DocumentBuilder', () => {
  let builder: DocumentBuilder;

  beforeEach(() => {
    builder = new DocumentBuilder('Test API', '1.0.0');
  });

  describe('생성 및 초기화', () => {
    it('기본 정보로 빌더를 생성해야 함', () => {
      const doc = builder.build();

      expect(doc.openapi).toBe('3.0.0');
      expect(doc.info.title).toBe('Test API');
      expect(doc.info.version).toBe('1.0.0');
      expect(doc.paths).toEqual({});
    });

    it('설명을 설정할 수 있어야 함', () => {
      builder.setDescription('API 설명');
      const doc = builder.build();

      expect(doc.info.description).toBe('API 설명');
    });

    it('서버를 추가할 수 있어야 함', () => {
      builder.addServer('http://localhost:3000', 'Development Server');
      const doc = builder.build();

      expect(doc.servers).toEqual([
        {
          url: 'http://localhost:3000',
          description: 'Development Server',
        },
      ]);
    });

    it('태그를 추가할 수 있어야 함', () => {
      builder.addTag('users', 'User management endpoints');
      const doc = builder.build();

      expect(doc.tags).toEqual([
        {
          name: 'users',
          description: 'User management endpoints',
        },
      ]);
    });
  });

  describe('경로 추가', () => {
    it('단순 경로를 추가할 수 있어야 함', () => {
      const operation: OperationObject = {
        summary: 'Get users',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      };

      builder.addPath('/users', 'get', operation);
      const doc = builder.build();

      expect(doc.paths['/users']).toBeDefined();
      expect(doc.paths['/users']?.get).toEqual(operation);
    });

    it('여러 메서드를 같은 경로에 추가할 수 있어야 함', () => {
      const getOp: OperationObject = {
        summary: 'Get users',
        responses: { '200': { description: 'Success' } },
      };
      const postOp: OperationObject = {
        summary: 'Create user',
        responses: { '201': { description: 'Created' } },
      };

      builder.addPath('/users', 'get', getOp);
      builder.addPath('/users', 'post', postOp);
      const doc = builder.build();

      expect(doc.paths['/users']?.get).toEqual(getOp);
      expect(doc.paths['/users']?.post).toEqual(postOp);
    });

    it('여러 경로를 추가할 수 있어야 함', () => {
      builder.addPath('/users', 'get', {
        responses: { '200': { description: 'Success' } },
      });
      builder.addPath('/posts', 'get', {
        responses: { '200': { description: 'Success' } },
      });

      const doc = builder.build();

      expect(Object.keys(doc.paths)).toHaveLength(2);
      expect(doc.paths['/users']).toBeDefined();
      expect(doc.paths['/posts']).toBeDefined();
    });
  });

  describe('컴포넌트 관리', () => {
    it('스키마 컴포넌트를 추가할 수 있어야 함', () => {
      const userSchema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      };

      builder.addSchema('User', userSchema);
      const doc = builder.build();

      expect(doc.components?.schemas?.['User']).toEqual(userSchema);
    });

    it('응답 컴포넌트를 추가할 수 있어야 함', () => {
      const errorResponse: ResponseObject = {
        description: 'Error response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      };

      builder.addResponse('Error', errorResponse);
      const doc = builder.build();

      expect(doc.components?.responses?.['Error']).toEqual(errorResponse);
    });

    it('여러 컴포넌트를 추가할 수 있어야 함', () => {
      builder.addSchema('User', {
        type: 'object',
        properties: { name: { type: 'string' } },
      });
      builder.addSchema('Post', {
        type: 'object',
        properties: { title: { type: 'string' } },
      });

      const doc = builder.build();

      expect(Object.keys(doc.components?.schemas || {})).toHaveLength(2);
    });
  });

  describe('스키마 참조 및 재사용', () => {
    it('스키마 참조를 자동으로 생성해야 함', () => {
      const userSchema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
      };

      builder.addSchema('User', userSchema);
      const ref = builder.getSchemaRef('User');

      expect(ref).toBe('#/components/schemas/User');
    });

    it('경로에서 컴포넌트 스키마를 참조할 수 있어야 함', () => {
      builder.addSchema('User', {
        type: 'object',
        properties: { name: { type: 'string' } },
      });

      builder.addPath('/users', 'get', {
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: builder.getSchemaRef('User') },
              },
            },
          },
        },
      });

      const doc = builder.build();

      expect(doc.paths['/users']?.get?.responses['200']?.content).toEqual({
        'application/json': {
          schema: { $ref: '#/components/schemas/User' },
        },
      });
    });
  });

  describe('스키마 병합', () => {
    it('동일한 스키마를 병합하지 않아야 함', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: { name: { type: 'string' } },
      };

      builder.addSchema('User', schema);
      builder.addSchema('User', schema);

      const doc = builder.build();

      expect(doc.components?.schemas?.['User']).toEqual(schema);
    });

    it('다른 스키마를 덮어쓰지 않아야 함', () => {
      const schema1: SchemaObject = {
        type: 'object',
        properties: { name: { type: 'string' } },
      };
      const schema2: SchemaObject = {
        type: 'object',
        properties: { age: { type: 'number' } },
      };

      builder.addSchema('User', schema1);
      builder.addSchema('User', schema2);

      const doc = builder.build();

      // 첫 번째 스키마가 유지되어야 함
      expect(doc.components?.schemas?.['User']).toEqual(schema1);
    });

    it('병합 옵션으로 스키마를 병합할 수 있어야 함', () => {
      const schema1: SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };
      const schema2: SchemaObject = {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
        required: ['age'],
      };

      builder.addSchema('User', schema1);
      builder.addSchema('User', schema2, { merge: true });

      const doc = builder.build();

      expect(doc.components?.schemas?.['User']).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      });
    });
  });

  describe('복합 시나리오', () => {
    it('전체 API 문서를 구성할 수 있어야 함', () => {
      // 기본 설정
      builder
        .setDescription('User management API')
        .addServer('http://localhost:3000', 'Development')
        .addTag('users', 'User operations');

      // 스키마 추가
      builder.addSchema('User', {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['id', 'name', 'email'],
      });

      builder.addSchema('Error', {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string' },
        },
      });

      // 경로 추가
      builder.addPath('/users', 'get', {
        tags: ['users'],
        summary: 'Get all users',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: builder.getSchemaRef('User') },
                },
              },
            },
          },
        },
      });

      builder.addPath('/users/{id}', 'get', {
        tags: ['users'],
        summary: 'Get user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: builder.getSchemaRef('User') },
              },
            },
          },
          '404': {
            description: 'Not found',
            content: {
              'application/json': {
                schema: { $ref: builder.getSchemaRef('Error') },
              },
            },
          },
        },
      });

      const doc = builder.build();

      // 검증
      expect(doc.openapi).toBe('3.0.0');
      expect(doc.info.title).toBe('Test API');
      expect(doc.info.description).toBe('User management API');
      expect(doc.servers).toHaveLength(1);
      expect(doc.tags).toHaveLength(1);
      expect(Object.keys(doc.paths)).toHaveLength(2);
      expect(Object.keys(doc.components?.schemas || {})).toHaveLength(2);
    });
  });

  describe('체이닝', () => {
    it('메서드 체이닝이 작동해야 함', () => {
      const doc = builder
        .setDescription('Test API')
        .addServer('http://localhost:3000')
        .addTag('test', 'Test endpoints')
        .addSchema('Test', { type: 'object' })
        .addPath('/test', 'get', {
          responses: { '200': { description: 'Success' } },
        })
        .build();

      expect(doc.info.description).toBe('Test API');
      expect(doc.servers).toHaveLength(1);
      expect(doc.tags).toHaveLength(1);
      expect(doc.components?.schemas?.['Test']).toBeDefined();
      expect(doc.paths['/test']).toBeDefined();
    });
  });

  describe('JSON 직렬화', () => {
    it('JSON으로 직렬화할 수 있어야 함', () => {
      builder.addPath('/test', 'get', {
        responses: { '200': { description: 'Success' } },
      });

      const json = builder.toJSON();
      const parsed: OpenAPIDocument = JSON.parse(json);

      expect(parsed.openapi).toBe('3.0.0');
      expect(parsed.info.title).toBe('Test API');
      expect(parsed.paths['/test']).toBeDefined();
    });

    it('포맷팅된 JSON을 생성할 수 있어야 함', () => {
      builder.addPath('/test', 'get', {
        responses: { '200': { description: 'Success' } },
      });

      const json = builder.toJSON(2);

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });
});
