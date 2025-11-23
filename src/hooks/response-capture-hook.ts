/**
 * Jest 훅 통합
 *
 * Jest afterEach 훅을 사용하여 캡처된 응답을 자동으로 검증
 */

import { metadataStorage } from '../types/metadata-storage';
import { ResponseInterceptor } from '../capture/response-interceptor';
import { SchemaValidator } from '../validation/schema-validator';

/**
 * Jest 환경에서 응답 캡처 기능 활성화
 *
 * afterEach 훅을 등록하여 각 테스트 실행 후 캡처된 응답을 자동으로 검증
 *
 * @param _jestEnv - Jest 환경 객체 (선택적, 향후 확장 용도)
 *
 * @example
 * ```typescript
 * // jest.setup.ts
 * import { setupResponseCapture } from 'jest-swagger';
 *
 * setupResponseCapture();
 * ```
 */
export function setupResponseCapture(_jestEnv?: any): void {
  // Jest afterEach 훅 등록
  if (typeof afterEach !== 'undefined') {
    afterEach(() => {
      processResponseCaptures();
    });
  }
}

/**
 * 캡처된 응답을 처리하고 검증
 */
function processResponseCaptures(): void {
  try {
    // 현재 테스트 메타데이터 조회
    const currentTest = getCurrentTestMetadata();

    if (!currentTest) {
      // 현재 테스트 정보가 없으면 pending captures만 초기화
      ResponseInterceptor.clearPendingCaptures();
      return;
    }

    // pending captures 조회
    const pendingCaptures = ResponseInterceptor.getPendingCaptures();

    if (pendingCaptures.length === 0) {
      // 캡처된 응답이 없으면 현재 테스트 초기화
      metadataStorage.clearCurrentTest();
      return;
    }

    // 캡처 메타데이터 조회
    const captureMetadata = metadataStorage.getCaptureMetadata(
      currentTest.target,
      currentTest.propertyKey
    );

    if (!captureMetadata || !captureMetadata.shouldCapture) {
      // 캡처가 비활성화된 경우
      ResponseInterceptor.clearPendingCaptures();
      metadataStorage.clearCurrentTest();
      return;
    }

    // 각 캡처된 응답에 대해 스키마 검증 수행
    for (const captured of pendingCaptures) {
      // 스키마 검증이 활성화된 경우
      if (captureMetadata.validateSchema) {
        validateCapturedResponse(currentTest.target, currentTest.propertyKey, captured);
      }

      // 메타데이터 저장소에 저장
      metadataStorage.setCapturedResponse(
        currentTest.target,
        currentTest.propertyKey,
        captured.statusCode,
        captured
      );
    }

    // pending captures 초기화
    ResponseInterceptor.clearPendingCaptures();

    // 현재 테스트 초기화
    metadataStorage.clearCurrentTest();
  } catch (error) {
    // 에러 발생 시에도 상태 초기화
    ResponseInterceptor.clearPendingCaptures();
    metadataStorage.clearCurrentTest();

    // 에러는 테스트 실패로 전파
    throw error;
  }
}

/**
 * 캡처된 응답을 스키마에 대해 검증
 *
 * @param target - 대상 클래스
 * @param propertyKey - 메서드 이름
 * @param captured - 캡처된 응답
 */
function validateCapturedResponse(
  target: object,
  propertyKey: string | symbol,
  captured: any
): void {
  // 응답 메타데이터 조회
  const responseMetadataList = metadataStorage.getResponseMetadata(target, propertyKey);

  // 해당 상태 코드에 대한 스키마 찾기
  const responseMetadata = responseMetadataList.find(
    (meta) => meta.statusCode === captured.statusCode
  );

  let schema = responseMetadata?.schema;

  // 스키마가 없으면 자동 추론
  if (!schema) {
    const captureMetadata = metadataStorage.getCaptureMetadata(target, propertyKey);
    if (captureMetadata?.autoInferSchema) {
      schema = SchemaValidator.inferSchema(captured.body);
    }
  }

  // 스키마가 있으면 검증
  if (schema) {
    const validation = SchemaValidator.validate(schema, captured.body);

    if (!validation.valid) {
      // 검증 실패 시 상세한 에러 메시지 생성
      const errorMessages = validation.errors
        .map((err) => `  - ${err.path}: ${err.message}`)
        .join('\n');

      throw new Error(
        `응답 스키마 검증 실패 (Response schema validation failed)\n` +
          `Method: ${String(propertyKey)}\n` +
          `Status Code: ${captured.statusCode}\n` +
          `Errors:\n${errorMessages}`
      );
    }
  }
}

/**
 * 현재 실행 중인 테스트의 메타데이터 조회
 *
 * @returns 현재 테스트 메타데이터 또는 undefined
 */
function getCurrentTestMetadata() {
  return metadataStorage.getCurrentTest();
}
