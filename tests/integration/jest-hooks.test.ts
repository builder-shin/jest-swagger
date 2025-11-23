/**
 * Jest 훅 통합 테스트
 */

import { setupResponseCapture } from '../../src/hooks/response-capture-hook';
import { metadataStorage } from '../../src/types/metadata-storage';
import { ResponseInterceptor } from '../../src/capture/response-interceptor';
import { SchemaValidator } from '../../src/validation/schema-validator';

describe('Jest Hooks Integration', () => {
  beforeEach(() => {
    // 각 테스트 전에 초기화
    metadataStorage.clear();
    ResponseInterceptor.clearPendingCaptures();
  });

  describe('Test Case 2.2.1: afterEach Hook Captures Response', () => {
    it('setupResponseCapture 함수가 정의되어 있음', () => {
      // setupResponseCapture 함수가 정의되어 있는지 확인
      expect(setupResponseCapture).toBeDefined();
      expect(typeof setupResponseCapture).toBe('function');
    });

    it('캡처된 응답이 있을 때 스키마 검증 수행', (done) => {
      // 모의 응답 데이터
      const mockResponse = {
        status: 200,
        data: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      // 응답 캡처
      const captured = ResponseInterceptor.capture(mockResponse);
      expect(ResponseInterceptor.getPendingCaptures()).toHaveLength(1);

      // 현재 테스트 메타데이터 설정 (실제로는 데코레이터가 설정)
      const target = {};
      const propertyKey = 'testMethod';

      metadataStorage.setCurrentTest(target, propertyKey);
      metadataStorage.setCaptureMetadata(target, propertyKey, {
        shouldCapture: true,
        statusCode: 200,
        autoInferSchema: true,
        validateSchema: true,
      });

      // afterEach 훅 시뮬레이션
      setTimeout(() => {
        // 현재 테스트 조회
        const currentTest = metadataStorage.getCurrentTest();
        expect(currentTest).toBeDefined();
        expect(currentTest?.propertyKey).toBe(propertyKey);

        // pending captures 조회
        const pendingCaptures = ResponseInterceptor.getPendingCaptures();
        expect(pendingCaptures).toHaveLength(1);

        // 스키마 추론 및 검증
        const schema = SchemaValidator.inferSchema(captured.body);
        const validation = SchemaValidator.validate(schema, captured.body);

        expect(validation.valid).toBe(true);
        expect(schema.type).toBe('object');

        // 테스트 완료
        metadataStorage.clearCurrentTest();
        ResponseInterceptor.clearPendingCaptures();

        done();
      }, 0);
    });

    it('스키마 검증 실패 시 명확한 에러 처리', (done) => {
      // 유효하지 않은 응답 데이터
      const mockResponse = {
        status: 200,
        data: {
          id: 'not-a-number', // 타입 불일치
          name: 'Test User',
        },
      };

      const captured = ResponseInterceptor.capture(mockResponse);

      const target = {};
      const propertyKey = 'testMethod';

      metadataStorage.setCurrentTest(target, propertyKey);
      metadataStorage.setCaptureMetadata(target, propertyKey, {
        shouldCapture: true,
        statusCode: 200,
        autoInferSchema: false, // 수동으로 스키마 제공
        validateSchema: true,
      });

      // 미리 정의된 스키마 설정
      metadataStorage.addResponseMetadata(target, propertyKey, {
        statusCode: 200,
        description: 'Success',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      });

      setTimeout(() => {
        // 스키마 검증
        const responseMetadata = metadataStorage.getResponseMetadata(target, propertyKey);
        expect(responseMetadata).toHaveLength(1);

        const schema = responseMetadata[0]?.schema;
        expect(schema).toBeDefined();

        if (schema) {
          const validation = SchemaValidator.validate(schema, captured.body);
          expect(validation.valid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
        }

        metadataStorage.clearCurrentTest();
        ResponseInterceptor.clearPendingCaptures();

        done();
      }, 0);
    });
  });

  describe('getCurrentTestMetadata', () => {
    it('현재 실행 중인 테스트 정보 조회', () => {
      const target = {};
      const propertyKey = 'myTestMethod';

      // 현재 테스트 설정
      metadataStorage.setCurrentTest(target, propertyKey);

      // 현재 테스트 조회
      const currentTest = metadataStorage.getCurrentTest();

      expect(currentTest).toBeDefined();
      expect(currentTest?.target).toBe(target);
      expect(currentTest?.propertyKey).toBe(propertyKey);

      // 정리
      metadataStorage.clearCurrentTest();
    });

    it('현재 테스트가 없으면 undefined 반환', () => {
      metadataStorage.clearCurrentTest();
      const currentTest = metadataStorage.getCurrentTest();
      expect(currentTest).toBeUndefined();
    });
  });

  describe('Capture Metadata Storage', () => {
    it('캡처 메타데이터 저장 및 조회', () => {
      const target = {};
      const propertyKey = 'testMethod';

      const metadata = {
        shouldCapture: true,
        statusCode: 200,
        autoInferSchema: true,
        validateSchema: false,
      };

      metadataStorage.setCaptureMetadata(target, propertyKey, metadata);

      const retrieved = metadataStorage.getCaptureMetadata(target, propertyKey);
      expect(retrieved).toEqual(metadata);
    });
  });
});
