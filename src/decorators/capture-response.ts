/**
 * @CaptureResponse 데코레이터
 *
 * Jest 테스트 실행 중 HTTP 응답을 자동으로 캡처하는 데코레이터
 */

import { metadataStorage } from '../types/metadata-storage';
import { CaptureMetadata } from '../types/decorator.types';
import { ResponseInterceptor } from '../capture/response-interceptor';

/**
 * 응답 캡처 옵션
 */
export interface CaptureOptions {
  /** HTTP 상태 코드 */
  statusCode: number;
  /** 스키마 자동 추론 활성화 (기본값: true) */
  autoInferSchema?: boolean;
  /** 스키마 검증 활성화 (기본값: false) */
  validateSchema?: boolean;
}

/**
 * HTTP 응답을 자동으로 캡처하는 메서드 데코레이터
 *
 * @param options - 캡처 옵션
 * @returns 메서드 데코레이터
 *
 * @example
 * ```typescript
 * class UserController {
 *   @CaptureResponse({ statusCode: 200 })
 *   async getUser(id: string) {
 *     const response = await fetch(`/api/users/${id}`);
 *     return response; // 자동으로 캡처됨
 *   }
 * }
 * ```
 */
export function CaptureResponse(options: CaptureOptions) {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    // 캡처 메타데이터 저장
    const captureMetadata: CaptureMetadata = {
      shouldCapture: true,
      statusCode: options.statusCode,
      autoInferSchema: options.autoInferSchema ?? true,
      validateSchema: options.validateSchema ?? false,
    };

    metadataStorage.setCaptureMetadata(target, propertyKey, captureMetadata);

    // 원본 메서드 저장
    const originalMethod = descriptor.value;

    // 메서드 래핑
    descriptor.value = function (...args: any[]): any {
      // 현재 테스트 설정
      metadataStorage.setCurrentTest(target, propertyKey);

      try {
        // 원본 메서드 실행
        const result = originalMethod.apply(this, args);

        // Promise인 경우 (async 메서드)
        if (result instanceof Promise) {
          return result.then((resolvedResult) => {
            // 응답 캡처
            captureResponse(target, propertyKey, options.statusCode, resolvedResult);
            return resolvedResult;
          });
        }

        // 동기 메서드인 경우
        captureResponse(target, propertyKey, options.statusCode, result);
        return result;
      } finally {
        // 메서드 실행 완료 시 현재 테스트 정보는 유지 (afterEach에서 사용)
        // clearCurrentTest는 afterEach에서 호출됨
      }
    };

    return descriptor;
  };
}

/**
 * 응답을 캡처하고 저장하는 헬퍼 함수
 *
 * @param target - 대상 클래스
 * @param propertyKey - 메서드 이름
 * @param statusCode - HTTP 상태 코드
 * @param response - 응답 객체
 */
function captureResponse(
  target: object,
  propertyKey: string | symbol,
  statusCode: number,
  response: any
): void {
  try {
    // ResponseInterceptor를 사용하여 응답 캡처
    const captured = ResponseInterceptor.capture(response);

    // 메타데이터 저장소에 캡처된 응답 저장
    metadataStorage.setCapturedResponse(target, propertyKey, statusCode, captured);
  } catch (error) {
    // 캡처 실패 시 무시 (테스트 실행에 영향을 주지 않음)
    console.warn(`Failed to capture response for ${String(propertyKey)}:`, error);
  }
}
