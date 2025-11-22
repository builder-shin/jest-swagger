/**
 * path 데코레이터 구현
 */

import { PathMetadata, Constructor } from '../types/decorator.types';
import { metadataStorage } from '../types/metadata-storage';

/**
 * 경로 정규화 헬퍼 함수
 * @param path 경로 문자열
 * @returns 정규화된 경로 (슬래시로 시작)
 */
function normalizePath(path: string): string {
  if (!path || path === '') {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * 부모 클래스의 전체 경로 조회
 * @param target 대상 클래스
 * @returns 부모 클래스들의 경로를 합친 전체 경로
 */
function getParentPath(target: Constructor): string | undefined {
  const parent = Object.getPrototypeOf(target);

  if (!parent?.prototype) {
    return undefined;
  }

  const parentMetadata = metadataStorage.getPathMetadata(parent.prototype);

  if (!parentMetadata) {
    // 부모의 부모를 재귀적으로 확인
    return getParentPath(parent);
  }

  // 부모의 basePath와 path를 합침
  const parentBasePath = parentMetadata.basePath || '';
  const parentPath = parentMetadata.path;

  return `${parentBasePath}${parentPath}`;
}

/**
 * 클래스에 경로를 설정하는 데코레이터
 *
 * @param pathString - API 엔드포인트 경로
 * @returns 클래스 데코레이터
 *
 * @example
 * ```typescript
 * @path('/users')
 * class UserController {
 *   // ...
 * }
 * ```
 *
 * @example 중첩 경로
 * ```typescript
 * @path('/api')
 * class ApiController {}
 *
 * @path('/users')
 * class UserController extends ApiController {
 *   // 전체 경로: /api/users
 * }
 * ```
 */
export function path(pathString: string) {
  return function <T extends Constructor>(target: T): T {
    const normalizedPath = normalizePath(pathString);
    const basePath = getParentPath(target);

    const metadata: PathMetadata = {
      path: normalizedPath,
      basePath,
    };

    metadataStorage.setPathMetadata(target.prototype, metadata);

    return target;
  };
}

/**
 * 클래스의 전체 경로 조회 헬퍼 함수
 * @param target 대상 클래스 또는 프로토타입
 * @returns 전체 경로 (basePath + path)
 */
export function getFullPath(target: object): string {
  const metadata = metadataStorage.getPathMetadata(target);

  if (!metadata) {
    return '/';
  }

  const basePath = metadata.basePath || '';
  return `${basePath}${metadata.path}`;
}
