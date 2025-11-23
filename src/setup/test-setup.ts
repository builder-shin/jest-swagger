/**
 * Jest 테스트 셋업 파일
 * 모든 테스트 실행 전에 초기화 작업 수행
 */

import { metadataStorage } from '../types/metadata-storage';
import { ResponseInterceptor } from '../capture/response-interceptor';

/**
 * 각 테스트 실행 전 메타데이터 초기화
 */
beforeEach(() => {
  // 메타데이터 스토리지 초기화
  metadataStorage.clear();

  // ResponseInterceptor의 pending captures 초기화
  ResponseInterceptor.clearPendingCaptures();
});

/**
 * 모든 테스트 완료 후 정리
 */
afterAll(() => {
  metadataStorage.clear();
  ResponseInterceptor.clearPendingCaptures();
});
