/**
 * response 데코레이터 구현
 */

import { ResponseMetadata, SchemaObject } from '../types';
import { metadataStorage } from '../types/metadata-storage';

/**
 * 응답 데코레이터
 *
 * API 엔드포인트의 응답 스키마를 정의합니다.
 *
 * @param statusCode HTTP 상태 코드
 * @param description 응답 설명
 * @param schema 응답 스키마 (선택)
 * @param mediaType 미디어 타입 (기본값: 'application/json')
 * @returns 메서드 데코레이터
 *
 * @example 기본 사용법
 * ```typescript
 * class UserController {
 *   @response(200, '성공')
 *   getUsers() {}
 * }
 * ```
 *
 * @example 스키마와 함께 사용
 * ```typescript
 * class UserController {
 *   @response(200, '성공', {
 *     type: 'object',
 *     properties: {
 *       id: { type: 'number' },
 *       name: { type: 'string' }
 *     }
 *   })
 *   getUser() {}
 * }
 * ```
 *
 * @example 여러 응답 정의
 * ```typescript
 * class UserController {
 *   @response(200, '성공', { type: 'object' })
 *   @response(404, '찾을 수 없음', {
 *     type: 'object',
 *     properties: { message: { type: 'string' } }
 *   })
 *   @response(500, '서버 오류')
 *   getUser() {}
 * }
 * ```
 *
 * @example 배열 응답
 * ```typescript
 * class UserController {
 *   @response(200, '성공', {
 *     type: 'array',
 *     items: {
 *       type: 'object',
 *       properties: {
 *         id: { type: 'number' },
 *         name: { type: 'string' }
 *       }
 *     }
 *   })
 *   getUsers() {}
 * }
 * ```
 */
export function response(
  statusCode: number,
  description: string,
  schema?: SchemaObject,
  mediaType: string = 'application/json'
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const metadata: ResponseMetadata = {
      statusCode,
      description,
      schema,
      mediaType,
    };

    metadataStorage.addResponseMetadata(target, propertyKey, metadata);

    return descriptor;
  };
}

/**
 * 성공 응답을 위한 헬퍼 데코레이터 (200 OK)
 *
 * @param description 응답 설명
 * @param schema 응답 스키마
 * @param mediaType 미디어 타입
 *
 * @example
 * ```typescript
 * class UserController {
 *   @response.ok('사용자 목록 조회 성공', { type: 'array' })
 *   getUsers() {}
 * }
 * ```
 */
response.ok = function (
  description: string = '성공',
  schema?: SchemaObject,
  mediaType?: string
): MethodDecorator {
  return response(200, description, schema, mediaType);
};

/**
 * 생성 응답을 위한 헬퍼 데코레이터 (201 Created)
 *
 * @param description 응답 설명
 * @param schema 응답 스키마
 * @param mediaType 미디어 타입
 */
response.created = function (
  description: string = '생성됨',
  schema?: SchemaObject,
  mediaType?: string
): MethodDecorator {
  return response(201, description, schema, mediaType);
};

/**
 * 삭제 응답을 위한 헬퍼 데코레이터 (204 No Content)
 *
 * @param description 응답 설명
 */
response.noContent = function (description: string = '삭제됨'): MethodDecorator {
  return response(204, description);
};

/**
 * 잘못된 요청 응답을 위한 헬퍼 데코레이터 (400 Bad Request)
 *
 * @param description 응답 설명
 * @param schema 응답 스키마
 * @param mediaType 미디어 타입
 */
response.badRequest = function (
  description: string = '잘못된 요청',
  schema?: SchemaObject,
  mediaType?: string
): MethodDecorator {
  return response(400, description, schema, mediaType);
};

/**
 * 인증 실패 응답을 위한 헬퍼 데코레이터 (401 Unauthorized)
 *
 * @param description 응답 설명
 * @param schema 응답 스키마
 * @param mediaType 미디어 타입
 */
response.unauthorized = function (
  description: string = '인증 실패',
  schema?: SchemaObject,
  mediaType?: string
): MethodDecorator {
  return response(401, description, schema, mediaType);
};

/**
 * 권한 없음 응답을 위한 헬퍼 데코레이터 (403 Forbidden)
 *
 * @param description 응답 설명
 * @param schema 응답 스키마
 * @param mediaType 미디어 타입
 */
response.forbidden = function (
  description: string = '권한 없음',
  schema?: SchemaObject,
  mediaType?: string
): MethodDecorator {
  return response(403, description, schema, mediaType);
};

/**
 * 찾을 수 없음 응답을 위한 헬퍼 데코레이터 (404 Not Found)
 *
 * @param description 응답 설명
 * @param schema 응답 스키마
 * @param mediaType 미디어 타입
 */
response.notFound = function (
  description: string = '찾을 수 없음',
  schema?: SchemaObject,
  mediaType?: string
): MethodDecorator {
  return response(404, description, schema, mediaType);
};

/**
 * 서버 오류 응답을 위한 헬퍼 데코레이터 (500 Internal Server Error)
 *
 * @param description 응답 설명
 * @param schema 응답 스키마
 * @param mediaType 미디어 타입
 */
response.internalServerError = function (
  description: string = '서버 오류',
  schema?: SchemaObject,
  mediaType?: string
): MethodDecorator {
  return response(500, description, schema, mediaType);
};
