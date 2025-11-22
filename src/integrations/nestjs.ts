/**
 * NestJS 데코레이터 통합
 *
 * NestJS 컨트롤러 데코레이터와 통합하여 OpenAPI 문서를 생성
 */

import 'reflect-metadata';
import { DocumentBuilder } from '../builders/document-builder';
import {
  HttpMethod,
  OperationObject,
  ParameterObject,
  ResponseObject,
  SchemaObject,
} from '../types/openapi.types';

/**
 * API 작업 옵션
 */
export interface ApiOperationOptions {
  summary?: string;
  description?: string;
  operationId?: string;
  deprecated?: boolean;
}

/**
 * API 응답 옵션
 */
export interface ApiResponseOptions {
  status: number;
  description: string;
  schema?: SchemaObject;
  type?: any;
}

/**
 * API 파라미터 옵션
 */
export interface ApiParamOptions {
  name: string;
  description?: string;
  required?: boolean;
  type?: any;
  schema?: SchemaObject;
}

/**
 * API 쿼리 파라미터 옵션
 */
export interface ApiQueryOptions {
  name: string;
  description?: string;
  required?: boolean;
  type?: any;
  schema?: SchemaObject;
}

/**
 * API 요청 본문 옵션
 */
export interface ApiBodyOptions {
  description?: string;
  schema?: SchemaObject;
  type?: any;
}

/**
 * 라우트 정보
 */
export interface RouteInfo {
  path: string;
  method: string;
  controller: any;
  handler: string;
}

/**
 * 문서 생성 옵션
 */
export interface CreateDocumentOptions {
  title: string;
  version: string;
  description?: string;
  routes: RouteInfo[];
}

/**
 * 컨트롤러 클래스에 태그를 추가하는 데코레이터
 *
 * @param tags - 태그 배열
 *
 * @example
 * ```typescript
 * @ApiTags('users')
 * class UserController {
 *   // ...
 * }
 * ```
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('swagger:tags', tags, target);
  };
}

/**
 * 메서드에 작업 정보를 추가하는 데코레이터
 *
 * @param options - 작업 옵션
 *
 * @example
 * ```typescript
 * @ApiOperation({ summary: '사용자 목록 조회' })
 * getUsers() {
 *   // ...
 * }
 * ```
 */
export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata('swagger:operation', options, target, propertyKey);
  };
}

/**
 * 메서드에 응답 정보를 추가하는 데코레이터
 *
 * @param options - 응답 옵션
 *
 * @example
 * ```typescript
 * @ApiResponse({ status: 200, description: '성공' })
 * @ApiResponse({ status: 404, description: '찾을 수 없음' })
 * getUser() {
 *   // ...
 * }
 * ```
 */
export function ApiResponse(options: ApiResponseOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existingResponses = Reflect.getMetadata('swagger:responses', target, propertyKey) || {};

    const response: ResponseObject = {
      description: options.description,
    };

    if (options.schema) {
      response.content = {
        'application/json': {
          schema: options.schema,
        },
      };
    }

    existingResponses[options.status.toString()] = { ...options };

    Reflect.defineMetadata('swagger:responses', existingResponses, target, propertyKey);
  };
}

/**
 * 메서드에 경로 파라미터 정보를 추가하는 데코레이터
 *
 * @param options - 파라미터 옵션
 *
 * @example
 * ```typescript
 * @ApiParam({ name: 'id', description: '사용자 ID' })
 * getUser(@Param('id') id: string) {
 *   // ...
 * }
 * ```
 */
export function ApiParam(options: ApiParamOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existingParams = Reflect.getMetadata('swagger:params', target, propertyKey) || [];

    const param: ParameterObject = {
      name: options.name,
      in: 'path',
      description: options.description,
      required: options.required !== false, // 기본값 true
    };

    if (options.schema) {
      param.schema = options.schema;
    }

    existingParams.push(param);

    Reflect.defineMetadata('swagger:params', existingParams, target, propertyKey);
  };
}

/**
 * 메서드에 쿼리 파라미터 정보를 추가하는 데코레이터
 *
 * @param options - 쿼리 파라미터 옵션
 *
 * @example
 * ```typescript
 * @ApiQuery({ name: 'page', description: '페이지 번호' })
 * @ApiQuery({ name: 'limit', description: '페이지 크기', required: false })
 * getUsers(@Query('page') page: number) {
 *   // ...
 * }
 * ```
 */
export function ApiQuery(options: ApiQueryOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existingParams = Reflect.getMetadata('swagger:params', target, propertyKey) || [];

    const param: ParameterObject = {
      name: options.name,
      in: 'query',
      description: options.description,
      required: options.required !== false, // 기본값 true
    };

    if (options.schema) {
      param.schema = options.schema;
    }

    existingParams.push(param);

    Reflect.defineMetadata('swagger:params', existingParams, target, propertyKey);
  };
}

/**
 * 메서드에 요청 본문 정보를 추가하는 데코레이터
 *
 * @param options - 요청 본문 옵션
 *
 * @example
 * ```typescript
 * @ApiBody({
 *   description: '사용자 정보',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       name: { type: 'string' },
 *       email: { type: 'string' }
 *     }
 *   }
 * })
 * createUser(@Body() user: CreateUserDto) {
 *   // ...
 * }
 * ```
 */
export function ApiBody(options: ApiBodyOptions): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata('swagger:body', options, target, propertyKey);
  };
}

/**
 * NestJS 컨트롤러에서 OpenAPI 문서 생성
 *
 * @param options - 문서 생성 옵션
 * @returns OpenAPI 문서
 *
 * @example
 * ```typescript
 * const document = createNestJSDocument({
 *   title: 'My API',
 *   version: '1.0.0',
 *   routes: [
 *     { path: '/users', method: 'GET', controller: UserController, handler: 'getUsers' },
 *     { path: '/users/:id', method: 'GET', controller: UserController, handler: 'getUser' }
 *   ]
 * });
 * ```
 */
export function createNestJSDocument(options: CreateDocumentOptions) {
  const builder = new DocumentBuilder(options.title, options.version);

  if (options.description) {
    builder.setDescription(options.description);
  }

  // 태그 수집
  const tags = new Set<string>();

  // 라우트 처리
  options.routes.forEach((route) => {
    const { path, method, controller, handler } = route;

    // 컨트롤러 태그 추출
    const controllerTags = Reflect.getMetadata('swagger:tags', controller) || [];
    controllerTags.forEach((tag: string) => tags.add(tag));

    // 메서드 메타데이터 추출
    const operation: ApiOperationOptions =
      Reflect.getMetadata('swagger:operation', controller.prototype, handler) || {};

    const responses: Record<string, ApiResponseOptions> =
      Reflect.getMetadata('swagger:responses', controller.prototype, handler) || {};

    const params: ParameterObject[] =
      Reflect.getMetadata('swagger:params', controller.prototype, handler) || [];

    const body: ApiBodyOptions =
      Reflect.getMetadata('swagger:body', controller.prototype, handler) || {};

    // 작업 객체 생성
    const operationObject: OperationObject = {
      tags: controllerTags,
      summary: operation.summary,
      description: operation.description,
      operationId: operation.operationId,
      deprecated: operation.deprecated,
      parameters: params.length > 0 ? params : undefined,
      responses: {},
    };

    // 응답 변환
    Object.entries(responses).forEach(([status, response]) => {
      operationObject.responses[status] = {
        description: response.description,
        content: response.schema
          ? {
              'application/json': {
                schema: response.schema,
              },
            }
          : undefined,
      };
    });

    // 기본 응답 추가
    if (Object.keys(operationObject.responses).length === 0) {
      operationObject.responses['200'] = {
        description: '성공',
      };
    }

    // 요청 본문 추가
    if (body.schema) {
      operationObject.requestBody = {
        description: body.description,
        content: {
          'application/json': {
            schema: body.schema,
          },
        },
      };
    }

    // 경로 추가
    builder.addPath(path, method.toLowerCase() as HttpMethod, operationObject);
  });

  // 태그 추가
  tags.forEach((tag) => {
    builder.addTag(tag);
  });

  return builder.build();
}
