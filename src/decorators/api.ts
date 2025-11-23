/**
 * api 데코레이터 구현
 */

import { HttpMethod, ApiMetadata } from '../types';
import { metadataStorage } from '../types/metadata-storage';

/**
 * API 옵션 인터페이스
 */
export interface ApiOptions {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
}

/**
 * API 데코레이터 생성 함수
 * @param method HTTP 메서드
 * @param pathOrOptions 경로 또는 옵션
 * @param options 추가 옵션
 */
function createApiDecorator(method: HttpMethod) {
  return function (pathOrOptions?: string | ApiOptions, options?: ApiOptions): MethodDecorator {
    return function (
      target: object,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor
    ): PropertyDescriptor {
      let path: string | undefined;
      let finalOptions: ApiOptions = {};

      // 파라미터 파싱
      if (typeof pathOrOptions === 'string') {
        path = pathOrOptions;
        finalOptions = options || {};
      } else if (pathOrOptions) {
        finalOptions = pathOrOptions;
      }

      const metadata: ApiMetadata = {
        method,
        path,
        summary: finalOptions.summary,
        description: finalOptions.description,
        tags: finalOptions.tags,
        deprecated: finalOptions.deprecated,
        target,
        propertyKey,
      };

      metadataStorage.setApiMetadata(target, propertyKey, metadata);

      return descriptor;
    };
  };
}

/**
 * API 데코레이터
 *
 * HTTP 메서드별 엔드포인트 정의를 위한 데코레이터
 */
export const api = {
  /**
   * GET 메서드 데코레이터
   * @param pathOrOptions 경로 또는 옵션
   * @param options 추가 옵션
   *
   * @example
   * ```typescript
   * class UserController {
   *   @api.get()
   *   getUsers() {}
   *
   *   @api.get('/:id')
   *   getUser() {}
   *
   *   @api.get({ summary: '사용자 목록' })
   *   listUsers() {}
   *
   *   @api.get('/:id', { summary: '사용자 상세' })
   *   getUserDetail() {}
   * }
   * ```
   */
  get: createApiDecorator('get'),

  /**
   * POST 메서드 데코레이터
   * @param pathOrOptions 경로 또는 옵션
   * @param options 추가 옵션
   *
   * @example
   * ```typescript
   * class UserController {
   *   @api.post({ summary: '사용자 생성' })
   *   createUser() {}
   * }
   * ```
   */
  post: createApiDecorator('post'),

  /**
   * PUT 메서드 데코레이터
   * @param pathOrOptions 경로 또는 옵션
   * @param options 추가 옵션
   *
   * @example
   * ```typescript
   * class UserController {
   *   @api.put('/:id', { summary: '사용자 전체 수정' })
   *   updateUser() {}
   * }
   * ```
   */
  put: createApiDecorator('put'),

  /**
   * DELETE 메서드 데코레이터
   * @param pathOrOptions 경로 또는 옵션
   * @param options 추가 옵션
   *
   * @example
   * ```typescript
   * class UserController {
   *   @api.delete('/:id', { summary: '사용자 삭제' })
   *   deleteUser() {}
   * }
   * ```
   */
  delete: createApiDecorator('delete'),

  /**
   * PATCH 메서드 데코레이터
   * @param pathOrOptions 경로 또는 옵션
   * @param options 추가 옵션
   *
   * @example
   * ```typescript
   * class UserController {
   *   @api.patch('/:id', { summary: '사용자 부분 수정' })
   *   patchUser() {}
   * }
   * ```
   */
  patch: createApiDecorator('patch'),

  /**
   * OPTIONS 메서드 데코레이터
   * @param pathOrOptions 경로 또는 옵션
   * @param options 추가 옵션
   */
  options: createApiDecorator('options'),

  /**
   * HEAD 메서드 데코레이터
   * @param pathOrOptions 경로 또는 옵션
   * @param options 추가 옵션
   */
  head: createApiDecorator('head'),
};
