/**
 * API 메타데이터 타입 정의 테스트
 * 데코레이터에서 사용되는 메타데이터 타입 검증
 */

import {
  ApiMetadata,
  PathMetadata,
  ResponseMetadata,
  ParameterMetadata,
  RequestBodyMetadata,
  SwaggerTestMetadata,
  SecurityMetadata,
  HttpMethod,
  ParameterLocation,
} from '../../src/types/decorator';

describe('API 메타데이터 타입 정의 테스트', () => {
  describe('SwaggerTestMetadata', () => {
    it('완전한 Swagger 테스트 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: SwaggerTestMetadata = {
        title: 'User API',
        version: '1.0.0',
        description: '사용자 관리 API',
        baseUrl: 'https://api.example.com',
        tags: ['users', 'authentication'],
        servers: [
          {
            url: 'https://api.example.com',
            description: 'Production',
          },
        ],
        security: [
          {
            bearerAuth: [],
          },
        ],
      };

      expect(metadata.title).toBe('User API');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.tags).toContain('users');
    });

    it('최소 필수 필드만으로 Swagger 테스트 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: SwaggerTestMetadata = {
        title: 'Minimal API',
        version: '0.1.0',
      };

      expect(metadata.title).toBe('Minimal API');
      expect(metadata.version).toBe('0.1.0');
    });
  });

  describe('PathMetadata', () => {
    it('GET 엔드포인트 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: PathMetadata = {
        method: 'GET',
        path: '/users/{id}',
        summary: '사용자 정보 조회',
        description: 'ID로 사용자 정보를 조회합니다',
        operationId: 'getUserById',
        tags: ['users'],
      };

      expect(metadata.method).toBe('GET');
      expect(metadata.path).toBe('/users/{id}');
      expect(metadata.operationId).toBe('getUserById');
    });

    it('POST 엔드포인트 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: PathMetadata = {
        method: 'POST',
        path: '/users',
        summary: '사용자 생성',
        tags: ['users'],
      };

      expect(metadata.method).toBe('POST');
      expect(metadata.path).toBe('/users');
    });

    it('모든 HTTP 메서드를 지원해야 함', () => {
      const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

      methods.forEach((method) => {
        const metadata: PathMetadata = {
          method,
          path: '/test',
          summary: 'Test',
        };

        expect(metadata.method).toBe(method);
      });
    });

    it('deprecated 플래그를 설정할 수 있어야 함', () => {
      const metadata: PathMetadata = {
        method: 'GET',
        path: '/legacy/users',
        summary: '레거시 사용자 조회',
        deprecated: true,
      };

      expect(metadata.deprecated).toBe(true);
    });
  });

  describe('ResponseMetadata', () => {
    it('성공 응답 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: ResponseMetadata = {
        status: 200,
        description: '성공적으로 조회됨',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      };

      expect(metadata.status).toBe(200);
      expect(metadata.description).toBe('성공적으로 조회됨');
      expect(metadata.schema?.type).toBe('object');
    });

    it('에러 응답 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: ResponseMetadata = {
        status: 404,
        description: '리소스를 찾을 수 없음',
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      };

      expect(metadata.status).toBe(404);
      expect(metadata.description).toBe('리소스를 찾을 수 없음');
    });

    it('응답 헤더를 정의할 수 있어야 함', () => {
      const metadata: ResponseMetadata = {
        status: 200,
        description: '성공',
        headers: {
          'X-Rate-Limit': {
            description: '시간당 요청 제한',
            schema: {
              type: 'integer',
            },
          },
          'X-Request-Id': {
            description: '요청 추적 ID',
            schema: {
              type: 'string',
            },
          },
        },
      };

      expect(metadata.headers?.['X-Rate-Limit']).toBeDefined();
      expect(metadata.headers?.['X-Request-Id']).toBeDefined();
    });

    it('응답 예제를 포함할 수 있어야 함', () => {
      const metadata: ResponseMetadata = {
        status: 200,
        description: '성공',
        example: {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      expect(metadata.example).toBeDefined();
      expect((metadata.example as { id: string }).id).toBe('123');
    });
  });

  describe('ParameterMetadata', () => {
    it('경로 파라미터 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: ParameterMetadata = {
        name: 'userId',
        in: 'path',
        required: true,
        description: '사용자 ID',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      };

      expect(metadata.in).toBe('path');
      expect(metadata.required).toBe(true);
      expect(metadata.schema?.format).toBe('uuid');
    });

    it('쿼리 파라미터 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: ParameterMetadata = {
        name: 'page',
        in: 'query',
        description: '페이지 번호',
        schema: {
          type: 'integer',
          default: 1,
          minimum: 1,
        },
      };

      expect(metadata.in).toBe('query');
      expect(metadata.schema?.default).toBe(1);
    });

    it('헤더 파라미터 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: ParameterMetadata = {
        name: 'X-API-Key',
        in: 'header',
        required: true,
        schema: {
          type: 'string',
        },
      };

      expect(metadata.in).toBe('header');
      expect(metadata.required).toBe(true);
    });

    it('쿠키 파라미터 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: ParameterMetadata = {
        name: 'sessionId',
        in: 'cookie',
        schema: {
          type: 'string',
        },
      };

      expect(metadata.in).toBe('cookie');
    });

    it('파라미터 위치 타입을 검증해야 함', () => {
      const locations: ParameterLocation[] = ['path', 'query', 'header', 'cookie'];

      locations.forEach((location) => {
        const metadata: ParameterMetadata = {
          name: 'test',
          in: location,
          schema: { type: 'string' },
        };

        expect(metadata.in).toBe(location);
      });
    });

    it('파라미터 예제를 포함할 수 있어야 함', () => {
      const metadata: ParameterMetadata = {
        name: 'status',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['active', 'inactive'],
        },
        example: 'active',
      };

      expect(metadata.example).toBe('active');
    });
  });

  describe('RequestBodyMetadata', () => {
    it('JSON 요청 본문 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: RequestBodyMetadata = {
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

      expect(metadata.required).toBe(true);
      expect(metadata.content['application/json']).toBeDefined();
    });

    it('여러 Content-Type을 지원할 수 있어야 함', () => {
      const metadata: RequestBodyMetadata = {
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
          'application/xml': {
            schema: { type: 'object' },
          },
          'multipart/form-data': {
            schema: { type: 'object' },
          },
        },
      };

      expect(Object.keys(metadata.content)).toHaveLength(3);
      expect(metadata.content['application/json']).toBeDefined();
      expect(metadata.content['application/xml']).toBeDefined();
      expect(metadata.content['multipart/form-data']).toBeDefined();
    });

    it('요청 본문 예제를 포함할 수 있어야 함', () => {
      const metadata: RequestBodyMetadata = {
        content: {
          'application/json': {
            schema: { type: 'object' },
            example: {
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        },
      };

      const example = metadata.content['application/json']?.example as {
        name: string;
        email: string;
      };
      expect(example?.name).toBe('John Doe');
    });
  });

  describe('SecurityMetadata', () => {
    it('Bearer 토큰 보안 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: SecurityMetadata = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      };

      expect(metadata.type).toBe('http');
      expect(metadata.scheme).toBe('bearer');
      expect(metadata.bearerFormat).toBe('JWT');
    });

    it('API Key 보안 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: SecurityMetadata = {
        type: 'apiKey',
        name: 'api_key',
        in: 'header',
      };

      expect(metadata.type).toBe('apiKey');
      expect(metadata.name).toBe('api_key');
      expect(metadata.in).toBe('header');
    });

    it('OAuth2 보안 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: SecurityMetadata = {
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

      expect(metadata.type).toBe('oauth2');
      expect(metadata.flows?.authorizationCode).toBeDefined();
    });
  });

  describe('ApiMetadata', () => {
    it('완전한 API 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: ApiMetadata = {
        path: {
          method: 'POST',
          path: '/users',
          summary: '사용자 생성',
          tags: ['users'],
        },
        parameters: [
          {
            name: 'X-API-Key',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        responses: [
          {
            status: 201,
            description: '생성됨',
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
          {
            status: 400,
            description: '잘못된 요청',
          },
        ],
        security: [
          {
            type: 'http',
            scheme: 'bearer',
          },
        ],
      };

      expect(metadata.path.method).toBe('POST');
      expect(metadata.parameters).toHaveLength(1);
      expect(metadata.requestBody?.required).toBe(true);
      expect(metadata.responses).toHaveLength(2);
      expect(metadata.security).toHaveLength(1);
    });

    it('최소 API 메타데이터를 생성할 수 있어야 함', () => {
      const metadata: ApiMetadata = {
        path: {
          method: 'GET',
          path: '/health',
          summary: '헬스 체크',
        },
        responses: [
          {
            status: 200,
            description: '정상',
          },
        ],
      };

      expect(metadata.path).toBeDefined();
      expect(metadata.responses).toHaveLength(1);
    });
  });

  describe('타입 안전성', () => {
    it('HTTP 메서드는 정의된 값만 허용해야 함', () => {
      const validMethods: HttpMethod[] = [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'OPTIONS',
        'HEAD',
      ];

      validMethods.forEach((method) => {
        const metadata: PathMetadata = {
          method,
          path: '/test',
          summary: 'Test',
        };

        expect(metadata.method).toBe(method);
      });
    });

    it('파라미터 위치는 정의된 값만 허용해야 함', () => {
      const validLocations: ParameterLocation[] = ['path', 'query', 'header', 'cookie'];

      validLocations.forEach((location) => {
        const metadata: ParameterMetadata = {
          name: 'test',
          in: location,
          schema: { type: 'string' },
        };

        expect(metadata.in).toBe(location);
      });
    });

    it('응답 상태 코드는 숫자여야 함', () => {
      const metadata: ResponseMetadata = {
        status: 200,
        description: '성공',
      };

      expect(typeof metadata.status).toBe('number');
      expect(metadata.status).toBeGreaterThanOrEqual(100);
      expect(metadata.status).toBeLessThan(600);
    });
  });

  describe('메타데이터 조합', () => {
    it('복잡한 API 엔드포인트 메타데이터를 구성할 수 있어야 함', () => {
      const pathMeta: PathMetadata = {
        method: 'PUT',
        path: '/users/{userId}',
        summary: '사용자 정보 수정',
        description: '사용자 정보를 수정합니다',
        operationId: 'updateUser',
        tags: ['users'],
      };

      const paramsMeta: ParameterMetadata[] = [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          name: 'include',
          in: 'query',
          schema: { type: 'array', items: { type: 'string' } },
        },
      ];

      const requestBodyMeta: RequestBodyMetadata = {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
      };

      const responsesMeta: ResponseMetadata[] = [
        {
          status: 200,
          description: '수정됨',
          schema: { $ref: '#/components/schemas/User' },
        },
        {
          status: 404,
          description: '사용자를 찾을 수 없음',
        },
      ];

      const apiMeta: ApiMetadata = {
        path: pathMeta,
        parameters: paramsMeta,
        requestBody: requestBodyMeta,
        responses: responsesMeta,
      };

      expect(apiMeta.path.method).toBe('PUT');
      expect(apiMeta.parameters).toHaveLength(2);
      expect(apiMeta.requestBody?.required).toBe(true);
      expect(apiMeta.responses).toHaveLength(2);
    });
  });
});
