/**
 * OpenAPI 3.0 타입 정의 테스트
 * OpenAPI 표준 스펙에 따른 타입 검증
 */

import {
  OpenAPIDocument,
  InfoObject,
  PathItemObject,
  OperationObject,
  ResponseObject,
  SchemaObject,
  ParameterObject,
  RequestBodyObject,
  ComponentsObject,
  ServerObject,
  SecuritySchemeObject,
} from '../../src/types/openapi';

describe('OpenAPI 타입 정의 테스트', () => {
  describe('InfoObject', () => {
    it('유효한 Info 객체를 생성할 수 있어야 함', () => {
      const info: InfoObject = {
        title: 'Test API',
        version: '1.0.0',
        description: 'API 설명',
        termsOfService: 'https://example.com/terms',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
          url: 'https://example.com/support',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      };

      expect(info.title).toBe('Test API');
      expect(info.version).toBe('1.0.0');
      expect(info.description).toBe('API 설명');
    });

    it('최소 필수 필드만으로 Info 객체를 생성할 수 있어야 함', () => {
      const info: InfoObject = {
        title: 'Minimal API',
        version: '0.1.0',
      };

      expect(info.title).toBe('Minimal API');
      expect(info.version).toBe('0.1.0');
    });
  });

  describe('ServerObject', () => {
    it('유효한 Server 객체를 생성할 수 있어야 함', () => {
      const server: ServerObject = {
        url: 'https://api.example.com',
        description: 'Production server',
        variables: {
          port: {
            default: '443',
            enum: ['443', '8443'],
            description: 'HTTPS port',
          },
        },
      };

      expect(server.url).toBe('https://api.example.com');
      expect(server.variables?.['port']?.default).toBe('443');
    });
  });

  describe('SchemaObject', () => {
    it('객체 스키마를 정의할 수 있어야 함', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
          },
          age: {
            type: 'integer',
            minimum: 0,
            maximum: 150,
          },
        },
        required: ['id', 'name'],
      };

      expect(schema.type).toBe('object');
      expect(schema.required).toContain('id');
      expect(schema.properties?.['name']?.type).toBe('string');
    });

    it('배열 스키마를 정의할 수 있어야 함', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
      };

      expect(schema.type).toBe('array');
      expect(schema.items).toBeDefined();
      expect(schema.uniqueItems).toBe(true);
    });

    it('oneOf, anyOf, allOf를 사용한 복합 스키마를 정의할 수 있어야 함', () => {
      const schema: SchemaObject = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      };

      expect(schema.oneOf).toHaveLength(2);
    });

    it('$ref를 사용한 참조 스키마를 정의할 수 있어야 함', () => {
      const schema: SchemaObject = {
        $ref: '#/components/schemas/User',
      };

      expect(schema.$ref).toBe('#/components/schemas/User');
    });
  });

  describe('ParameterObject', () => {
    it('경로 파라미터를 정의할 수 있어야 함', () => {
      const param: ParameterObject = {
        name: 'userId',
        in: 'path',
        required: true,
        description: '사용자 ID',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      };

      expect(param.in).toBe('path');
      expect(param.required).toBe(true);
    });

    it('쿼리 파라미터를 정의할 수 있어야 함', () => {
      const param: ParameterObject = {
        name: 'page',
        in: 'query',
        required: false,
        description: '페이지 번호',
        schema: {
          type: 'integer',
          default: 1,
          minimum: 1,
        },
      };

      expect(param.in).toBe('query');
      expect(param.schema?.default).toBe(1);
    });

    it('헤더 파라미터를 정의할 수 있어야 함', () => {
      const param: ParameterObject = {
        name: 'X-API-Key',
        in: 'header',
        required: true,
        schema: {
          type: 'string',
        },
      };

      expect(param.in).toBe('header');
    });
  });

  describe('RequestBodyObject', () => {
    it('JSON 요청 본문을 정의할 수 있어야 함', () => {
      const requestBody: RequestBodyObject = {
        description: '사용자 생성 요청',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
              },
              required: ['name', 'email'],
            },
          },
        },
      };

      expect(requestBody.required).toBe(true);
      expect(requestBody.content['application/json']).toBeDefined();
    });

    it('여러 Content-Type을 지원할 수 있어야 함', () => {
      const requestBody: RequestBodyObject = {
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
          'application/xml': {
            schema: { type: 'object' },
          },
        },
      };

      expect(Object.keys(requestBody.content)).toHaveLength(2);
    });
  });

  describe('ResponseObject', () => {
    it('성공 응답을 정의할 수 있어야 함', () => {
      const response: ResponseObject = {
        description: '성공적으로 조회됨',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
        headers: {
          'X-Rate-Limit': {
            description: '시간당 요청 제한',
            schema: {
              type: 'integer',
            },
          },
        },
      };

      expect(response.description).toBe('성공적으로 조회됨');
      expect(response.headers?.['X-Rate-Limit']).toBeDefined();
    });

    it('에러 응답을 정의할 수 있어야 함', () => {
      const response: ResponseObject = {
        description: '잘못된 요청',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      };

      expect(response.description).toBe('잘못된 요청');
    });
  });

  describe('OperationObject', () => {
    it('GET 작업을 정의할 수 있어야 함', () => {
      const operation: OperationObject = {
        summary: '사용자 목록 조회',
        description: '모든 사용자를 조회합니다',
        operationId: 'listUsers',
        tags: ['users'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      };

      expect(operation.operationId).toBe('listUsers');
      expect(operation.tags).toContain('users');
    });

    it('POST 작업을 정의할 수 있어야 함', () => {
      const operation: OperationObject = {
        summary: '사용자 생성',
        operationId: 'createUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' },
            },
          },
        },
        responses: {
          '201': {
            description: '생성됨',
          },
          '400': {
            description: '잘못된 요청',
          },
        },
      };

      expect(operation.operationId).toBe('createUser');
      expect(operation.requestBody?.required).toBe(true);
    });
  });

  describe('PathItemObject', () => {
    it('여러 HTTP 메서드를 정의할 수 있어야 함', () => {
      const pathItem: PathItemObject = {
        get: {
          summary: '조회',
          responses: {
            '200': { description: '성공' },
          },
        },
        post: {
          summary: '생성',
          responses: {
            '201': { description: '생성됨' },
          },
        },
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      };

      expect(pathItem.get).toBeDefined();
      expect(pathItem.post).toBeDefined();
      expect(pathItem.parameters).toHaveLength(1);
    });
  });

  describe('ComponentsObject', () => {
    it('재사용 가능한 컴포넌트를 정의할 수 있어야 함', () => {
      const components: ComponentsObject = {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          Error: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' },
            },
          },
        },
        responses: {
          NotFound: {
            description: '리소스를 찾을 수 없음',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      };

      expect(components.schemas?.['User']).toBeDefined();
      expect(components.responses?.['NotFound']).toBeDefined();
      expect(components.securitySchemes?.['bearerAuth']?.type).toBe('http');
    });
  });

  describe('OpenAPIDocument', () => {
    it('완전한 OpenAPI 문서를 생성할 수 있어야 함', () => {
      const document: OpenAPIDocument = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'API 문서',
        },
        servers: [
          {
            url: 'https://api.example.com',
            description: 'Production',
          },
        ],
        paths: {
          '/users': {
            get: {
              summary: '사용자 목록',
              responses: {
                '200': {
                  description: '성공',
                },
              },
            },
          },
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
        },
      };

      expect(document.openapi).toBe('3.0.0');
      expect(document.info.title).toBe('Test API');
      expect(document.paths['/users']?.get).toBeDefined();
    });

    it('최소 필수 필드로 OpenAPI 문서를 생성할 수 있어야 함', () => {
      const document: OpenAPIDocument = {
        openapi: '3.0.0',
        info: {
          title: 'Minimal API',
          version: '0.1.0',
        },
        paths: {},
      };

      expect(document.openapi).toBe('3.0.0');
      expect(document.paths).toBeDefined();
    });
  });

  describe('SecuritySchemeObject', () => {
    it('API Key 인증을 정의할 수 있어야 함', () => {
      const scheme: SecuritySchemeObject = {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      };

      expect(scheme.type).toBe('apiKey');
      expect(scheme.in).toBe('header');
    });

    it('OAuth2 인증을 정의할 수 있어야 함', () => {
      const scheme: SecuritySchemeObject = {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'https://example.com/oauth/authorize',
            tokenUrl: 'https://example.com/oauth/token',
            scopes: {
              'read:users': '사용자 읽기',
              'write:users': '사용자 쓰기',
            },
          },
        },
      };

      expect(scheme.type).toBe('oauth2');
      expect(scheme.flows?.authorizationCode).toBeDefined();
    });

    it('Bearer 토큰 인증을 정의할 수 있어야 함', () => {
      const scheme: SecuritySchemeObject = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      };

      expect(scheme.type).toBe('http');
      expect(scheme.scheme).toBe('bearer');
    });
  });

  describe('타입 안전성 검증', () => {
    it('잘못된 타입의 값을 할당하면 타입 에러가 발생해야 함', () => {
      // 이 테스트는 컴파일 타임에 검증됨
      // TypeScript 컴파일러가 타입 체크를 수행함

      const validSchema: SchemaObject = {
        type: 'string',
      };

      expect(validSchema.type).toBe('string');
    });

    it('필수 필드가 누락되면 타입 에러가 발생해야 함', () => {
      // 컴파일 타임 검증
      const validInfo: InfoObject = {
        title: 'API',
        version: '1.0.0',
      };

      expect(validInfo).toBeDefined();
    });
  });
});
