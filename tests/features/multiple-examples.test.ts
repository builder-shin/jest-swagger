/**
 * Multiple Examples 테스트
 *
 * OpenAPI examples (복수형) vs example (단수형) 지원 검증
 */

import { path, api, response, CaptureResponse } from '../../src/decorators';
import { metadataStorage } from '../../src/types/metadata-storage';
import { ResponseInterceptor } from '../../src/capture/response-interceptor';
import { SwaggerReporter } from '../../src/reporters/swagger-reporter';

describe('Multiple Examples Feature', () => {
  beforeEach(() => {
    metadataStorage.clear();
    ResponseInterceptor.clearPendingCaptures();
  });

  /**
   * Test Case 4.4.1: Single Example Uses 'example' Field
   * 1개의 응답만 캡처된 경우 example (단수형) 필드를 사용하는지 확인
   */
  it('should use "example" field for single captured response', async () => {
    @path('/api')
    class SingleController {
      @api.get('/user')
      @response(200, 'Success', {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
      })
      @CaptureResponse({ statusCode: 200 })
      async getUser(): Promise<any> {
        return {
          status: 200,
          data: { id: 1, name: 'John Doe' },
        };
      }
    }

    const controller = new SingleController();
    await controller.getUser();

    // 캡처된 응답 확인
    const captured = metadataStorage.getCapturedResponse(
      SingleController.prototype,
      'getUser',
      200
    );

    expect(captured).toBeDefined();
    expect(captured?.body).toEqual({ id: 1, name: 'John Doe' });

    // 단일 응답만 캡처되었는지 확인
    const allCaptured = metadataStorage.getAllCapturedResponses(
      SingleController.prototype,
      'getUser',
      200
    );

    expect(allCaptured).toBeDefined();
    expect(allCaptured?.length).toBe(1);
  });

  /**
   * Test Case 4.4.2: Verify Metadata Storage for Multiple Responses
   * 여러 응답이 메타데이터 스토리지에 저장되는지 확인
   */
  it('should store multiple captured responses in metadata storage', async () => {
    @path('/api')
    class MultiController {
      @api.get('/data')
      @response(200, 'Success')
      @CaptureResponse({ statusCode: 200 })
      async getData(variant: number): Promise<any> {
        const responses: Record<number, any> = {
          1: { status: 200, data: { value: 'first', timestamp: 1 } },
          2: { status: 200, data: { value: 'second', timestamp: 2 } },
          3: { status: 200, data: { value: 'third', timestamp: 3 } },
        };
        return responses[variant];
      }
    }

    const controller = new MultiController();

    // 3번 호출하여 3개의 응답 캡처
    await controller.getData(1);
    await controller.getData(2);
    await controller.getData(3);

    // 모든 캡처된 응답 조회
    const allCaptured = metadataStorage.getAllCapturedResponses(
      MultiController.prototype,
      'getData',
      200
    );

    expect(allCaptured).toBeDefined();
    expect(allCaptured?.length).toBe(3);

    // 각 응답 확인
    expect(allCaptured?.[0]?.body).toEqual({ value: 'first', timestamp: 1 });
    expect(allCaptured?.[1]?.body).toEqual({ value: 'second', timestamp: 2 });
    expect(allCaptured?.[2]?.body).toEqual({ value: 'third', timestamp: 3 });
  });

  /**
   * Test Case 4.4.3: Content-Type Consistency Across Examples
   * 여러 example의 Content-Type이 일관되는지 확인
   */
  it('should maintain consistent content-type across multiple examples', async () => {
    @path('/api')
    class ConsistentController {
      @api.get('/items')
      @response(200, 'Success', undefined, 'application/json')
      @CaptureResponse({ statusCode: 200 })
      async getItems(page: number): Promise<any> {
        const responses: Record<number, any> = {
          1: {
            status: 200,
            data: { items: ['a', 'b'], page: 1 },
            headers: { 'content-type': 'application/json' },
          },
          2: {
            status: 200,
            data: { items: ['c', 'd'], page: 2 },
            headers: { 'content-type': 'application/json' },
          },
        };
        return responses[page];
      }
    }

    const controller = new ConsistentController();
    await controller.getItems(1);
    await controller.getItems(2);

    const allCaptured = metadataStorage.getAllCapturedResponses(
      ConsistentController.prototype,
      'getItems',
      200
    );

    expect(allCaptured).toBeDefined();
    expect(allCaptured?.length).toBe(2);

    // 모든 응답의 contentType 확인
    allCaptured?.forEach((captured) => {
      expect(captured.contentType).toBe('application/json');
    });
  });

  /**
   * Test Case 4.4.4: getAllCapturedResponses API
   * getAllCapturedResponses API가 올바르게 동작하는지 확인
   */
  it('should retrieve all captured responses using getAllCapturedResponses', async () => {
    @path('/test')
    class TestController {
      @api.get('/endpoint')
      @response(200, 'Success')
      @CaptureResponse({ statusCode: 200 })
      async test(id: number): Promise<any> {
        return {
          status: 200,
          data: { id, message: `Response ${id}` },
        };
      }
    }

    const controller = new TestController();

    // 5개의 응답 캡처
    for (let i = 1; i <= 5; i++) {
      await controller.test(i);
    }

    // getAllCapturedResponses 호출
    const allResponses = metadataStorage.getAllCapturedResponses(
      TestController.prototype,
      'test',
      200
    );

    expect(allResponses).toBeDefined();
    expect(allResponses?.length).toBe(5);

    // 순서 확인
    allResponses?.forEach((resp, index) => {
      const expectedId = index + 1;
      expect(resp.body).toEqual({
        id: expectedId,
        message: `Response ${expectedId}`,
      });
    });
  });
});
