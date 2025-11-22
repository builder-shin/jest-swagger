/**
 * Fastify 플러그인 통합
 *
 * Fastify 서버에서 자동으로 OpenAPI 문서를 생성하는 플러그인
 */

import { FastifyInstance, FastifyPluginCallback, RouteOptions } from 'fastify';
import fp from 'fastify-plugin';
import { DocumentBuilder } from '../builders/document-builder';
import { HttpMethod, ParameterObject, SchemaObject } from '../types/openapi.types';
import { stringify as yamlStringify } from 'yaml';

/**
 * 확장된 Fastify 스키마 (OpenAPI 속성 포함)
 */
export interface ExtendedFastifySchema {
  description?: string;
  tags?: string[];
  body?: any;
  querystring?: any;
  params?: any;
  headers?: any;
  response?: Record<string, any>;
}

/**
 * Fastify Swagger 플러그인 옵션
 */
export interface FastifySwaggerOptions {
  /**
   * DocumentBuilder 인스턴스 (선택)
   */
  builder?: DocumentBuilder;

  /**
   * 문서 라우트 접두사
   * @default '/documentation'
   */
  routePrefix?: string;

  /**
   * 문서 라우트를 노출할지 여부
   * @default true
   */
  exposeRoute?: boolean;

  /**
   * 경로를 자동으로 수집할지 여부
   * @default false
   */
  autoCollect?: boolean;

  /**
   * 제외할 경로 목록
   */
  excludePaths?: string[];

  /**
   * API 제목 (builder를 제공하지 않을 때 사용)
   * @default 'API Documentation'
   */
  title?: string;

  /**
   * API 버전 (builder를 제공하지 않을 때 사용)
   * @default '1.0.0'
   */
  version?: string;
}

/**
 * Fastify JSON Schema를 OpenAPI Schema로 변환
 */
function convertJsonSchemaToOpenAPI(schema: any): SchemaObject {
  const openApiSchema: SchemaObject = {};

  if (schema.type) {
    openApiSchema.type = schema.type;
  }

  if (schema.properties) {
    openApiSchema.properties = {};
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      openApiSchema.properties![key] = convertJsonSchemaToOpenAPI(value);
    });
  }

  if (schema.items) {
    openApiSchema.items = convertJsonSchemaToOpenAPI(schema.items);
  }

  if (schema.required) {
    openApiSchema.required = schema.required;
  }

  if (schema.description) {
    openApiSchema.description = schema.description;
  }

  if (schema.format) {
    openApiSchema.format = schema.format;
  }

  if (schema.enum) {
    openApiSchema.enum = schema.enum;
  }

  if (schema.minimum !== undefined) {
    openApiSchema.minimum = schema.minimum;
  }

  if (schema.maximum !== undefined) {
    openApiSchema.maximum = schema.maximum;
  }

  if (schema.minLength !== undefined) {
    openApiSchema.minLength = schema.minLength;
  }

  if (schema.maxLength !== undefined) {
    openApiSchema.maxLength = schema.maxLength;
  }

  if (schema.pattern) {
    openApiSchema.pattern = schema.pattern;
  }

  return openApiSchema;
}

/**
 * querystring 스키마를 파라미터 배열로 변환
 */
function convertQuerystringToParameters(querystring: any): ParameterObject[] {
  const parameters: ParameterObject[] = [];

  if (querystring.properties) {
    Object.entries(querystring.properties).forEach(([name, schema]: [string, any]) => {
      parameters.push({
        name,
        in: 'query',
        required: querystring.required?.includes(name) || false,
        schema: convertJsonSchemaToOpenAPI(schema),
      });
    });
  }

  return parameters;
}

/**
 * params 스키마를 파라미터 배열로 변환
 */
function convertParamsToParameters(params: any): ParameterObject[] {
  const parameters: ParameterObject[] = [];

  if (params.properties) {
    Object.entries(params.properties).forEach(([name, schema]: [string, any]) => {
      parameters.push({
        name,
        in: 'path',
        required: true, // 경로 파라미터는 항상 필수
        schema: convertJsonSchemaToOpenAPI(schema),
      });
    });
  }

  return parameters;
}

/**
 * Fastify 플러그인 (내부 함수)
 */
const fastifySwaggerPlugin: FastifyPluginCallback<FastifySwaggerOptions> = (
  fastify: FastifyInstance,
  options,
  done
) => {
  const {
    builder = new DocumentBuilder(options.title || 'API Documentation', options.version || '1.0.0'),
    routePrefix = '/documentation',
    exposeRoute = true,
    autoCollect = false,
    excludePaths = [],
  } = options;

  // Swagger 문서를 반환하는 데코레이터 추가
  if (!fastify.hasDecorator('swagger')) {
    fastify.decorate('swagger', () => {
      return builder.build();
    });
  }

  // 라우트 등록 후 자동 수집
  if (autoCollect) {
    fastify.addHook('onRoute', (routeOptions) => {
      const { url, method } = routeOptions;

      // 제외 경로 확인
      if (excludePaths.includes(url)) {
        return;
      }

      // 문서 경로 자체는 제외
      if (url.startsWith(routePrefix)) {
        return;
      }

      const methods = Array.isArray(method) ? method : [method];

      methods.forEach((m) => {
        const httpMethod = m.toLowerCase() as HttpMethod;
        const schema = (routeOptions.schema || {}) as any;

        // 파라미터 수집
        const parameters: ParameterObject[] = [];

        if (schema.querystring) {
          parameters.push(...convertQuerystringToParameters(schema.querystring));
        }

        if (schema.params) {
          parameters.push(...convertParamsToParameters(schema.params));
        }

        // 작업 정의 생성
        const operation: any = {
          summary: schema.description || `${m} ${url}`,
          tags: schema.tags || [],
          parameters: parameters.length > 0 ? parameters : undefined,
          responses: {},
        };

        // 요청 본문 추가
        if (schema.body) {
          operation.requestBody = {
            content: {
              'application/json': {
                schema: convertJsonSchemaToOpenAPI(schema.body),
              },
            },
          };
        }

        // 응답 추가
        if (schema.response) {
          Object.entries(schema.response).forEach(([statusCode, responseSchema]: [string, any]) => {
            operation.responses[statusCode] = {
              description: responseSchema.description || 'Response',
              content: {
                'application/json': {
                  schema: convertJsonSchemaToOpenAPI(responseSchema),
                },
              },
            };
          });
        } else {
          // 기본 응답
          operation.responses['200'] = {
            description: '성공',
          };
        }

        builder.addPath(url, httpMethod, operation);
      });
    });
  }

  // 문서 라우트 노출
  if (exposeRoute) {
    // JSON 엔드포인트
    fastify.get(`${routePrefix}/json`, async (_request, reply) => {
      reply.type('application/json');
      return builder.build();
    });

    // YAML 엔드포인트
    fastify.get(`${routePrefix}/yaml`, async (_request, reply) => {
      const document = builder.build();
      reply.type('text/yaml');
      return yamlStringify(document);
    });
  }

  done();
};

/**
 * Fastify Swagger 플러그인 (export)
 */
export const fastifySwagger = fp(fastifySwaggerPlugin, {
  fastify: '>=4.x',
  name: 'jest-swagger',
});

/**
 * 라우트를 등록하고 문서에 추가
 *
 * @param fastify - Fastify 인스턴스
 * @param options - 라우트 옵션
 *
 * @example
 * ```typescript
 * registerRoute(fastify, {
 *   method: 'GET',
 *   url: '/users/:id',
 *   schema: {
 *     description: '사용자 조회',
 *     tags: ['users'],
 *     params: {
 *       type: 'object',
 *       properties: {
 *         id: { type: 'string' }
 *       }
 *     },
 *     response: {
 *       200: {
 *         type: 'object',
 *         properties: {
 *           id: { type: 'string' },
 *           name: { type: 'string' }
 *         }
 *       }
 *     }
 *   },
 *   handler: async (request, reply) => {
 *     return { id: '1', name: 'Test' }
 *   }
 * });
 * ```
 */
export function registerRoute(fastify: FastifyInstance, options: RouteOptions): void {
  // 라우트를 Fastify에 등록
  fastify.route(options);

  // swagger 데코레이터가 있는지 확인
  if (!fastify.hasDecorator('swagger')) {
    return;
  }

  const { url, method, schema = {} } = options;
  const methods = Array.isArray(method) ? method : [method];

  // DocumentBuilder 접근 (내부적으로 저장된 builder에 접근)
  const doc = (fastify as any).swagger();
  const builder = new DocumentBuilder(doc.info.title, doc.info.version);

  // 기존 경로 복사
  Object.entries(doc.paths).forEach(([path, pathItem]) => {
    Object.entries(pathItem as any).forEach(([m, operation]: [string, any]) => {
      if (m !== 'summary' && m !== 'description' && m !== 'parameters') {
        builder.addPath(path, m as HttpMethod, operation);
      }
    });
  });

  methods.forEach((m) => {
    const httpMethod = (typeof m === 'string' ? m.toLowerCase() : m) as HttpMethod;
    const schemaObj = (schema || {}) as any;

    // 파라미터 수집
    const parameters: ParameterObject[] = [];

    if (schemaObj.querystring) {
      parameters.push(...convertQuerystringToParameters(schemaObj.querystring));
    }

    if (schemaObj.params) {
      parameters.push(...convertParamsToParameters(schemaObj.params));
    }

    // 작업 정의 생성
    const operation: any = {
      summary: schemaObj.description || `${m} ${url}`,
      tags: schemaObj.tags || [],
      parameters: parameters.length > 0 ? parameters : undefined,
      responses: {},
    };

    // 요청 본문 추가
    if (schemaObj.body) {
      operation.requestBody = {
        content: {
          'application/json': {
            schema: convertJsonSchemaToOpenAPI(schemaObj.body),
          },
        },
      };
    }

    // 응답 추가
    if (schemaObj.response) {
      Object.entries(schemaObj.response).forEach(([statusCode, responseSchema]: [string, any]) => {
        operation.responses[statusCode] = {
          description: responseSchema.description || 'Response',
          content: {
            'application/json': {
              schema: convertJsonSchemaToOpenAPI(responseSchema),
            },
          },
        };
      });
    } else {
      operation.responses['200'] = {
        description: '성공',
      };
    }

    builder.addPath(url, httpMethod, operation);
  });

  // swagger 데코레이터 업데이트
  if (!fastify.hasDecorator('swagger')) {
    (fastify as any).decorate('swagger', () => builder.build());
  } else {
    // 이미 존재하는 경우 함수 자체를 교체
    (fastify as any).swagger = () => builder.build();
  }
}
