/**
 * MetadataStorage 확장 기능 테스트
 */

import { metadataStorage } from '../../src/types/metadata-storage';
import { CapturedResponse } from '../../src/capture/response-interceptor';
import { ResponseMetadata } from '../../src/types/decorator.types';

describe('MetadataStorage Enhanced', () => {
  // 테스트용 클래스
  class TestController {
    testMethod(): void {
      // 테스트용 메서드
    }
  }

  beforeEach(() => {
    // 각 테스트 전에 메타데이터 초기화
    metadataStorage.clear();
  });

  describe('Test Case 1.2.1: Store Captured Response', () => {
    it('캡처된 응답을 저장할 수 있어야 한다', () => {
      // Given: 캡처된 응답 객체
      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: { id: 1, name: 'Test User' },
        contentType: 'application/json',
        headers: { 'content-type': 'application/json' },
        timestamp: Date.now(),
      };

      // When: 캡처된 응답을 저장한다
      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        200,
        capturedResponse
      );

      // Then: 저장된 응답을 조회할 수 있어야 한다
      const retrieved = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );

      expect(retrieved).toBeDefined();
      expect(retrieved?.statusCode).toBe(200);
      expect(retrieved?.body).toEqual({ id: 1, name: 'Test User' });
      expect(retrieved?.contentType).toBe('application/json');
    });

    it('동일한 status code에 대해 여러 응답을 저장할 수 있어야 한다', () => {
      // Given: 동일한 status code를 가진 여러 응답
      const response1: CapturedResponse = {
        statusCode: 200,
        body: { id: 1 },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      const response2: CapturedResponse = {
        statusCode: 200,
        body: { id: 2 },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now() + 100,
      };

      // When: 여러 응답을 저장한다
      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        200,
        response1
      );
      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        200,
        response2
      );

      // Then: 모든 응답을 조회할 수 있어야 한다
      const allResponses = metadataStorage.getAllCapturedResponses(
        TestController.prototype,
        'testMethod',
        200
      );

      expect(allResponses).toHaveLength(2);
      expect(allResponses[0]?.body).toEqual({ id: 1 });
      expect(allResponses[1]?.body).toEqual({ id: 2 });
    });

    it('getCapturedResponse는 첫 번째 응답만 반환해야 한다', () => {
      // Given: 여러 개의 캡처된 응답
      const response1: CapturedResponse = {
        statusCode: 200,
        body: { id: 1 },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      const response2: CapturedResponse = {
        statusCode: 200,
        body: { id: 2 },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now() + 100,
      };

      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        200,
        response1
      );
      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        200,
        response2
      );

      // When: 단일 응답을 조회한다
      const single = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );

      // Then: 첫 번째 응답만 반환되어야 한다
      expect(single).toBeDefined();
      expect(single?.body).toEqual({ id: 1 });
    });

    it('서로 다른 status code의 응답을 구분하여 저장해야 한다', () => {
      // Given: 서로 다른 status code를 가진 응답들
      const response200: CapturedResponse = {
        statusCode: 200,
        body: { success: true },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      const response400: CapturedResponse = {
        statusCode: 400,
        body: { error: 'Bad Request' },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      // When: 각각 저장한다
      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        200,
        response200
      );
      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        400,
        response400
      );

      // Then: 각 status code별로 조회할 수 있어야 한다
      const retrieved200 = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );
      const retrieved400 = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        400
      );

      expect(retrieved200?.body).toEqual({ success: true });
      expect(retrieved400?.body).toEqual({ error: 'Bad Request' });
    });

    it('존재하지 않는 응답 조회시 undefined를 반환해야 한다', () => {
      // When: 저장되지 않은 응답을 조회한다
      const retrieved = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );

      // Then: undefined를 반환해야 한다
      expect(retrieved).toBeUndefined();
    });

    it('getAllCapturedResponses는 존재하지 않는 경우 빈 배열을 반환해야 한다', () => {
      // When: 저장되지 않은 응답 목록을 조회한다
      const responses = metadataStorage.getAllCapturedResponses(
        TestController.prototype,
        'testMethod',
        200
      );

      // Then: 빈 배열을 반환해야 한다
      expect(responses).toEqual([]);
    });
  });

  describe('Test Case 1.2.2: Merge Decorator Metadata with Captured Response', () => {
    it('데코레이터 메타데이터와 캡처된 응답을 병합할 수 있어야 한다', () => {
      // Given: 데코레이터 메타데이터
      const decoratorMetadata: ResponseMetadata = {
        statusCode: 200,
        description: 'Successful response',
        mediaType: 'application/json',
      };

      // Given: 캡처된 응답
      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: { id: 1, name: 'Test User' },
        contentType: 'application/json',
        headers: { 'content-type': 'application/json' },
        timestamp: Date.now(),
      };

      // When: 메타데이터를 병합한다
      const merged = metadataStorage.mergeResponseMetadata(decoratorMetadata, capturedResponse);

      // Then: 병합된 메타데이터를 반환해야 한다
      expect(merged).toBeDefined();
      expect(merged.statusCode).toBe(200);
      expect(merged.description).toBe('Successful response');
      expect(merged.mediaType).toBe('application/json');
      expect(merged.schema).toBeDefined();
    });

    it('캡처된 응답에서 스키마를 자동 추론해야 한다', () => {
      // Given: 스키마가 없는 데코레이터 메타데이터
      const decoratorMetadata: ResponseMetadata = {
        statusCode: 200,
        description: 'User data',
      };

      // Given: 객체 구조를 가진 캡처된 응답
      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          isActive: true,
        },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      // When: 메타데이터를 병합한다
      const merged = metadataStorage.mergeResponseMetadata(decoratorMetadata, capturedResponse);

      // Then: 스키마가 자동 생성되어야 한다
      expect(merged.schema).toBeDefined();
      expect(merged.schema?.type).toBe('object');
      expect(merged.schema?.properties).toBeDefined();
      expect(merged.schema?.properties?.['id']).toEqual({ type: 'number' });
      expect(merged.schema?.properties?.['name']).toEqual({ type: 'string' });
      expect(merged.schema?.properties?.['email']).toEqual({ type: 'string' });
      expect(merged.schema?.properties?.['isActive']).toEqual({ type: 'boolean' });
    });

    it('데코레이터에 이미 스키마가 있으면 유지해야 한다', () => {
      // Given: 스키마가 있는 데코레이터 메타데이터
      const decoratorMetadata: ResponseMetadata = {
        statusCode: 200,
        description: 'User data',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            customField: { type: 'string' },
          },
        },
      };

      // Given: 캡처된 응답
      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: { id: 1, name: 'Test' },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      // When: 메타데이터를 병합한다
      const merged = metadataStorage.mergeResponseMetadata(decoratorMetadata, capturedResponse);

      // Then: 기존 스키마가 유지되어야 한다
      expect(merged.schema).toBeDefined();
      expect(merged.schema?.properties?.['customField']).toEqual({ type: 'string' });
    });

    it('배열 응답의 스키마를 올바르게 추론해야 한다', () => {
      // Given: 데코레이터 메타데이터
      const decoratorMetadata: ResponseMetadata = {
        statusCode: 200,
        description: 'User list',
      };

      // Given: 배열 응답
      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      // When: 메타데이터를 병합한다
      const merged = metadataStorage.mergeResponseMetadata(decoratorMetadata, capturedResponse);

      // Then: 배열 스키마가 생성되어야 한다
      expect(merged.schema).toBeDefined();
      expect(merged.schema?.type).toBe('array');
      expect(merged.schema?.items).toBeDefined();
      expect(merged.schema?.items?.type).toBe('object');
    });

    it('원시 타입 응답의 스키마를 올바르게 추론해야 한다', () => {
      // Given: 문자열 응답
      const decoratorMetadata: ResponseMetadata = {
        statusCode: 200,
        description: 'Message',
      };

      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: 'Success message',
        contentType: 'text/plain',
        headers: {},
        timestamp: Date.now(),
      };

      // When: 메타데이터를 병합한다
      const merged = metadataStorage.mergeResponseMetadata(decoratorMetadata, capturedResponse);

      // Then: 문자열 스키마가 생성되어야 한다
      expect(merged.schema).toBeDefined();
      expect(merged.schema?.type).toBe('string');
    });

    it('null 응답을 처리할 수 있어야 한다', () => {
      // Given: null 응답
      const decoratorMetadata: ResponseMetadata = {
        statusCode: 204,
        description: 'No content',
      };

      const capturedResponse: CapturedResponse = {
        statusCode: 204,
        body: null,
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      // When: 메타데이터를 병합한다
      const merged = metadataStorage.mergeResponseMetadata(decoratorMetadata, capturedResponse);

      // Then: 에러가 발생하지 않아야 하며 스키마가 없어야 한다
      expect(merged).toBeDefined();
      expect(merged.schema).toBeUndefined();
    });
  });

  describe('Multiple Methods and Targets', () => {
    class AnotherController {
      anotherMethod(): void {
        // 테스트용 메서드
      }
    }

    it('서로 다른 클래스의 응답을 구분하여 저장해야 한다', () => {
      // Given: 서로 다른 클래스의 응답
      const response1: CapturedResponse = {
        statusCode: 200,
        body: { controller: 'test' },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      const response2: CapturedResponse = {
        statusCode: 200,
        body: { controller: 'another' },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      // When: 각 클래스에 응답을 저장한다
      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        200,
        response1
      );
      metadataStorage.setCapturedResponse(
        AnotherController.prototype,
        'anotherMethod',
        200,
        response2
      );

      // Then: 각 클래스별로 조회할 수 있어야 한다
      const retrieved1 = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );
      const retrieved2 = metadataStorage.getCapturedResponse(
        AnotherController.prototype,
        'anotherMethod',
        200
      );

      expect(retrieved1?.body).toEqual({ controller: 'test' });
      expect(retrieved2?.body).toEqual({ controller: 'another' });
    });

    it('동일한 클래스의 서로 다른 메서드 응답을 구분하여 저장해야 한다', () => {
      // Given: 동일 클래스의 서로 다른 메서드
      class MultiMethodController {
        method1(): void {}
        method2(): void {}
      }

      const response1: CapturedResponse = {
        statusCode: 200,
        body: { method: 'method1' },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      const response2: CapturedResponse = {
        statusCode: 200,
        body: { method: 'method2' },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      // When: 각 메서드에 응답을 저장한다
      metadataStorage.setCapturedResponse(
        MultiMethodController.prototype,
        'method1',
        200,
        response1
      );
      metadataStorage.setCapturedResponse(
        MultiMethodController.prototype,
        'method2',
        200,
        response2
      );

      // Then: 각 메서드별로 조회할 수 있어야 한다
      const retrieved1 = metadataStorage.getCapturedResponse(
        MultiMethodController.prototype,
        'method1',
        200
      );
      const retrieved2 = metadataStorage.getCapturedResponse(
        MultiMethodController.prototype,
        'method2',
        200
      );

      expect(retrieved1?.body).toEqual({ method: 'method1' });
      expect(retrieved2?.body).toEqual({ method: 'method2' });
    });
  });

  describe('Clear Functionality', () => {
    it('clear 메서드가 캡처된 응답도 초기화해야 한다', () => {
      // Given: 캡처된 응답이 저장되어 있음
      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: { id: 1 },
        contentType: 'application/json',
        headers: {},
        timestamp: Date.now(),
      };

      metadataStorage.setCapturedResponse(
        TestController.prototype,
        'testMethod',
        200,
        capturedResponse
      );

      // When: clear를 호출한다
      metadataStorage.clear();

      // Then: 캡처된 응답이 초기화되어야 한다
      const retrieved = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );

      expect(retrieved).toBeUndefined();
    });
  });
});
