/**
 * ResponseInterceptor 테스트
 */

import { ResponseInterceptor, CapturedResponse } from '../../src/capture/response-interceptor';

describe('ResponseInterceptor', () => {
  beforeEach(() => {
    ResponseInterceptor.clearPendingCaptures();
  });

  describe('Test Case 1.1.1: Basic Response Capture', () => {
    it('HTTP 응답을 성공적으로 캡처해야 한다', () => {
      // Given: HTTP 응답 객체
      const mockResponse = {
        status: 200,
        data: { id: 1, name: 'Test User' },
        headers: {
          'content-type': 'application/json',
          'x-custom-header': 'custom-value',
        },
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: 캡처된 응답이 올바른 형식이어야 한다
      expect(captured).toBeDefined();
      expect(captured.statusCode).toBe(200);
      expect(captured.body).toEqual({ id: 1, name: 'Test User' });
      expect(captured.contentType).toBe('application/json');
      expect(captured.headers).toEqual({
        'content-type': 'application/json',
        'x-custom-header': 'custom-value',
      });
      expect(captured.timestamp).toBeGreaterThan(0);
      expect(typeof captured.timestamp).toBe('number');
    });

    it('다양한 status code를 캡처할 수 있어야 한다', () => {
      // Given: 다양한 status code를 가진 응답들
      const responses = [
        { status: 200, data: { success: true } },
        { status: 201, data: { created: true } },
        { status: 400, data: { error: 'Bad Request' } },
        { status: 404, data: { error: 'Not Found' } },
        { status: 500, data: { error: 'Internal Server Error' } },
      ];

      // When: 각 응답을 캡처한다
      const captured = responses.map((res) => ResponseInterceptor.capture(res));

      // Then: 각 응답이 올바른 status code를 가져야 한다
      expect(captured[0]?.statusCode).toBe(200);
      expect(captured[1]?.statusCode).toBe(201);
      expect(captured[2]?.statusCode).toBe(400);
      expect(captured[3]?.statusCode).toBe(404);
      expect(captured[4]?.statusCode).toBe(500);
    });

    it('헤더가 없는 응답도 처리할 수 있어야 한다', () => {
      // Given: 헤더가 없는 응답
      const mockResponse = {
        status: 200,
        data: { message: 'ok' },
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: 빈 헤더 객체와 기본 content-type을 가져야 한다
      expect(captured.statusCode).toBe(200);
      expect(captured.headers).toEqual({});
      expect(captured.contentType).toBe('application/json');
    });
  });

  describe('Test Case 1.1.2: Multiple Response Capture', () => {
    it('여러 응답을 순차적으로 캡처할 수 있어야 한다', () => {
      // Given: 여러 개의 응답
      const response1 = { status: 200, data: { id: 1 } };
      const response2 = { status: 201, data: { id: 2 } };
      const response3 = { status: 400, data: { error: 'Invalid' } };

      // When: 순차적으로 응답을 캡처한다
      ResponseInterceptor.capture(response1);
      ResponseInterceptor.capture(response2);
      ResponseInterceptor.capture(response3);

      // Then: 모든 응답이 pending captures에 저장되어야 한다
      const pending = ResponseInterceptor.getPendingCaptures();
      expect(pending).toHaveLength(3);
      expect(pending[0]?.statusCode).toBe(200);
      expect(pending[1]?.statusCode).toBe(201);
      expect(pending[2]?.statusCode).toBe(400);
    });

    it('pending captures를 초기화할 수 있어야 한다', () => {
      // Given: 여러 개의 캡처된 응답
      ResponseInterceptor.capture({ status: 200, data: {} });
      ResponseInterceptor.capture({ status: 201, data: {} });

      // When: pending captures를 초기화한다
      ResponseInterceptor.clearPendingCaptures();

      // Then: pending captures가 비어있어야 한다
      const pending = ResponseInterceptor.getPendingCaptures();
      expect(pending).toHaveLength(0);
    });

    it('clearPendingCaptures 후 새로운 캡처가 가능해야 한다', () => {
      // Given: 초기화된 상태
      ResponseInterceptor.capture({ status: 200, data: {} });
      ResponseInterceptor.clearPendingCaptures();

      // When: 새로운 응답을 캡처한다
      ResponseInterceptor.capture({ status: 201, data: { id: 1 } });

      // Then: 새로운 캡처만 존재해야 한다
      const pending = ResponseInterceptor.getPendingCaptures();
      expect(pending).toHaveLength(1);
      expect(pending[0]?.statusCode).toBe(201);
    });
  });

  describe('Test Case 1.1.3: Non-JSON Response Handling', () => {
    it('문자열 응답을 처리할 수 있어야 한다', () => {
      // Given: 문자열 응답
      const mockResponse = {
        status: 200,
        data: 'Plain text response',
        headers: { 'content-type': 'text/plain' },
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: 문자열 body와 올바른 content-type을 가져야 한다
      expect(captured.statusCode).toBe(200);
      expect(captured.body).toBe('Plain text response');
      expect(captured.contentType).toBe('text/plain');
    });

    it('XML 응답을 처리할 수 있어야 한다', () => {
      // Given: XML 응답
      const xmlData = '<?xml version="1.0"?><root><item>value</item></root>';
      const mockResponse = {
        status: 200,
        data: xmlData,
        headers: { 'content-type': 'application/xml' },
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: XML body와 올바른 content-type을 가져야 한다
      expect(captured.statusCode).toBe(200);
      expect(captured.body).toBe(xmlData);
      expect(captured.contentType).toBe('application/xml');
    });

    it('빈 응답을 처리할 수 있어야 한다', () => {
      // Given: 빈 응답 (204 No Content)
      const mockResponse = {
        status: 204,
        data: null,
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: null body를 가져야 한다
      expect(captured.statusCode).toBe(204);
      expect(captured.body).toBeNull();
    });

    it('바이너리 데이터를 처리할 수 있어야 한다', () => {
      // Given: 바이너리 응답
      const binaryData = Buffer.from('binary data');
      const mockResponse = {
        status: 200,
        data: binaryData,
        headers: { 'content-type': 'application/octet-stream' },
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: 바이너리 body와 올바른 content-type을 가져야 한다
      expect(captured.statusCode).toBe(200);
      expect(captured.body).toBe(binaryData);
      expect(captured.contentType).toBe('application/octet-stream');
    });

    it('배열 응답을 처리할 수 있어야 한다', () => {
      // Given: 배열 응답
      const mockResponse = {
        status: 200,
        data: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
        headers: { 'content-type': 'application/json' },
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: 배열 body를 가져야 한다
      expect(captured.statusCode).toBe(200);
      expect(Array.isArray(captured.body)).toBe(true);
      expect(captured.body).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('응답 객체가 status 대신 statusCode를 사용하는 경우를 처리해야 한다', () => {
      // Given: statusCode 필드를 가진 응답
      const mockResponse = {
        statusCode: 200,
        data: { id: 1 },
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: statusCode를 올바르게 추출해야 한다
      expect(captured.statusCode).toBe(200);
    });

    it('응답 객체가 body 필드를 사용하는 경우를 처리해야 한다', () => {
      // Given: body 필드를 가진 응답
      const mockResponse = {
        status: 200,
        body: { id: 1 },
      };

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture(mockResponse);

      // Then: body를 올바르게 추출해야 한다
      expect(captured.statusCode).toBe(200);
      expect(captured.body).toEqual({ id: 1 });
    });

    it('timestamp가 밀리초 단위로 생성되어야 한다', () => {
      // Given: 현재 시간
      const before = Date.now();

      // When: 응답을 캡처한다
      const captured = ResponseInterceptor.capture({ status: 200, data: {} });
      const after = Date.now();

      // Then: timestamp가 현재 시간 범위 내에 있어야 한다
      expect(captured.timestamp).toBeGreaterThanOrEqual(before);
      expect(captured.timestamp).toBeLessThanOrEqual(after);
    });

    it('getPendingCaptures는 원본 배열의 복사본을 반환해야 한다', () => {
      // Given: 캡처된 응답
      ResponseInterceptor.capture({ status: 200, data: {} });

      // When: pending captures를 가져온다
      const pending1 = ResponseInterceptor.getPendingCaptures();
      const pending2 = ResponseInterceptor.getPendingCaptures();

      // Then: 서로 다른 배열 인스턴스여야 한다
      expect(pending1).not.toBe(pending2);
      expect(pending1).toEqual(pending2);
    });
  });
});
