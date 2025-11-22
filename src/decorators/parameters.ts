/**
 * 파라미터 데코레이터 구현
 */

import { ParameterLocation, ParameterMetadata, SchemaObject } from '../types';
import { metadataStorage } from '../types/metadata-storage';

/**
 * 파라미터 옵션 인터페이스
 */
export interface ParameterOptions {
  description?: string;
  required?: boolean;
  schema?: SchemaObject;
  example?: unknown;
}

/**
 * 파라미터 데코레이터 생성 함수
 * @param location 파라미터 위치
 * @param name 파라미터 이름
 * @param options 추가 옵션
 */
function createParameterDecorator(
  location: ParameterLocation,
  name: string,
  options: ParameterOptions = {}
): ParameterDecorator {
  return function (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ): void {
    if (!propertyKey) {
      throw new Error('파라미터 데코레이터는 메서드 파라미터에만 사용할 수 있습니다.');
    }

    const metadata: ParameterMetadata = {
      name,
      in: location,
      description: options.description,
      required: location === 'path' ? true : options.required,
      schema: options.schema,
      example: options.example,
      propertyKey: propertyKey.toString(),
      parameterIndex,
    };

    metadataStorage.addParameterMetadata(target, propertyKey, metadata);
  };
}

/**
 * 쿼리 파라미터 데코레이터
 *
 * URL 쿼리 스트링 파라미터를 정의합니다.
 *
 * @param name 파라미터 이름
 * @param options 파라미터 옵션
 * @returns 파라미터 데코레이터
 *
 * @example 기본 사용법
 * ```typescript
 * class UserController {
 *   @api.get()
 *   getUsers(
 *     @query('page') page: number,
 *     @query('limit') limit: number
 *   ) {}
 * }
 * ```
 *
 * @example 옵션과 함께 사용
 * ```typescript
 * class UserController {
 *   @api.get()
 *   getUsers(
 *     @query('page', {
 *       description: '페이지 번호',
 *       required: true,
 *       schema: { type: 'integer', minimum: 1 }
 *     })
 *     page: number
 *   ) {}
 * }
 * ```
 */
export function query(name: string, options?: ParameterOptions): ParameterDecorator {
  return createParameterDecorator('query', name, options);
}

/**
 * 경로 파라미터 데코레이터
 *
 * URL 경로에 포함된 파라미터를 정의합니다.
 * 경로 파라미터는 항상 필수입니다.
 *
 * @param name 파라미터 이름
 * @param options 파라미터 옵션 (required는 무시됨)
 * @returns 파라미터 데코레이터
 *
 * @example
 * ```typescript
 * class UserController {
 *   @api.get('/:id')
 *   getUser(@pathParam('id') id: number) {}
 *
 *   @api.get('/:userId/posts/:postId')
 *   getUserPost(
 *     @pathParam('userId') userId: number,
 *     @pathParam('postId') postId: number
 *   ) {}
 * }
 * ```
 */
export function pathParam(name: string, options?: ParameterOptions): ParameterDecorator {
  return createParameterDecorator('path', name, options);
}

/**
 * 헤더 파라미터 데코레이터
 *
 * HTTP 헤더 파라미터를 정의합니다.
 *
 * @param name 헤더 이름
 * @param options 파라미터 옵션
 * @returns 파라미터 데코레이터
 *
 * @example
 * ```typescript
 * class UserController {
 *   @api.get()
 *   getUsers(
 *     @header('Authorization', {
 *       description: 'Bearer 토큰',
 *       required: true
 *     })
 *     auth: string
 *   ) {}
 *
 *   @api.post()
 *   createUser(
 *     @header('X-API-Key', { description: 'API 키' })
 *     apiKey: string,
 *     @header('Content-Type')
 *     contentType: string
 *   ) {}
 * }
 * ```
 */
export function header(name: string, options?: ParameterOptions): ParameterDecorator {
  return createParameterDecorator('header', name, options);
}

/**
 * 쿠키 파라미터 데코레이터
 *
 * HTTP 쿠키 파라미터를 정의합니다.
 *
 * @param name 쿠키 이름
 * @param options 파라미터 옵션
 * @returns 파라미터 데코레이터
 *
 * @example
 * ```typescript
 * class UserController {
 *   @api.get()
 *   getProfile(
 *     @cookie('sessionId', {
 *       description: '세션 ID',
 *       required: true
 *     })
 *     sessionId: string
 *   ) {}
 * }
 * ```
 */
export function cookie(name: string, options?: ParameterOptions): ParameterDecorator {
  return createParameterDecorator('cookie', name, options);
}

/**
 * 요청 본문 파라미터 데코레이터
 *
 * HTTP 요청 본문을 정의합니다.
 * POST, PUT, PATCH 등의 메서드에서 사용됩니다.
 *
 * @param options 파라미터 옵션
 * @returns 파라미터 데코레이터
 *
 * @example
 * ```typescript
 * interface CreateUserDto {
 *   name: string;
 *   email: string;
 * }
 *
 * class UserController {
 *   @api.post()
 *   createUser(
 *     @body({
 *       description: '사용자 생성 데이터',
 *       required: true,
 *       schema: {
 *         type: 'object',
 *         properties: {
 *           name: { type: 'string' },
 *           email: { type: 'string', format: 'email' }
 *         },
 *         required: ['name', 'email']
 *       }
 *     })
 *     data: CreateUserDto
 *   ) {}
 * }
 * ```
 */
export function body(options: ParameterOptions = {}): ParameterDecorator {
  return function (
    target: object,
    propertyKey: string | symbol | undefined,
    _parameterIndex: number
  ): void {
    if (!propertyKey) {
      throw new Error('body 데코레이터는 메서드 파라미터에만 사용할 수 있습니다.');
    }

    const requestBodyMetadata = {
      description: options.description,
      schema: options.schema,
      required: options.required !== false, // 기본값 true
      mediaType: 'application/json',
    };

    metadataStorage.setRequestBodyMetadata(target, propertyKey, requestBodyMetadata);
  };
}
