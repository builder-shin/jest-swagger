/**
 * @CaptureResponse 데코레이터 테스트
 */

import { CaptureResponse } from '../../src/decorators/capture-response';
import { metadataStorage } from '../../src/types/metadata-storage';
import { ResponseInterceptor } from '../../src/capture/response-interceptor';

describe('@CaptureResponse Decorator', () => {
  beforeEach(() => {
    // 각 테스트 전에 메타데이터와 캡처 초기화
    metadataStorage.clear();
    ResponseInterceptor.clearPendingCaptures();
  });

  describe('Test Case 1.3.1: Basic Decorator Functionality', () => {
    it('데코레이터가 메타데이터를 저장해야 한다', () => {
      // Given: CaptureResponse 데코레이터가 적용된 클래스
      class TestController {
        @CaptureResponse({ statusCode: 200 })
        testMethod(): any {
          return { id: 1, name: 'Test' };
        }
      }

      // When: 메타데이터를 조회한다
      const metadata = metadataStorage.getCaptureMetadata(
        TestController.prototype,
        'testMethod'
      );

      // Then: 메타데이터가 저장되어 있어야 한다
      expect(metadata).toBeDefined();
      expect(metadata?.shouldCapture).toBe(true);
      expect(metadata?.statusCode).toBe(200);
      expect(metadata?.autoInferSchema).toBe(true);
      expect(metadata?.validateSchema).toBe(false);
    });

    it('autoInferSchema 옵션을 커스터마이즈할 수 있어야 한다', () => {
      // Given: autoInferSchema가 false인 데코레이터
      class TestController {
        @CaptureResponse({ statusCode: 200, autoInferSchema: false })
        testMethod(): any {
          return { id: 1 };
        }
      }

      // When: 메타데이터를 조회한다
      const metadata = metadataStorage.getCaptureMetadata(
        TestController.prototype,
        'testMethod'
      );

      // Then: autoInferSchema가 false여야 한다
      expect(metadata?.autoInferSchema).toBe(false);
    });

    it('validateSchema 옵션을 설정할 수 있어야 한다', () => {
      // Given: validateSchema가 true인 데코레이터
      class TestController {
        @CaptureResponse({ statusCode: 200, validateSchema: true })
        testMethod(): any {
          return { id: 1 };
        }
      }

      // When: 메타데이터를 조회한다
      const metadata = metadataStorage.getCaptureMetadata(
        TestController.prototype,
        'testMethod'
      );

      // Then: validateSchema가 true여야 한다
      expect(metadata?.validateSchema).toBe(true);
    });

    it('원본 메서드를 래핑하여 응답을 캡처해야 한다', () => {
      // Given: CaptureResponse 데코레이터가 적용된 메서드
      class TestController {
        @CaptureResponse({ statusCode: 200 })
        testMethod(): any {
          return { id: 1, name: 'Test User' };
        }
      }

      const controller = new TestController();

      // When: 메서드를 실행한다
      const result = controller.testMethod();

      // Then: 원본 메서드의 결과가 반환되어야 한다
      expect(result).toEqual({ id: 1, name: 'Test User' });
    });

    it('메서드 실행 시 응답을 자동으로 캡처해야 한다', () => {
      // Given: CaptureResponse 데코레이터가 적용된 메서드
      class TestController {
        @CaptureResponse({ statusCode: 200 })
        testMethod(): any {
          return {
            status: 200,
            data: { id: 1, name: 'Test User' },
            headers: { 'content-type': 'application/json' },
          };
        }
      }

      const controller = new TestController();

      // When: 메서드를 실행한다
      controller.testMethod();

      // Then: 응답이 캡처되어 저장되어야 한다
      const captured = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );

      expect(captured).toBeDefined();
      expect(captured?.statusCode).toBe(200);
      expect(captured?.body).toEqual({ id: 1, name: 'Test User' });
    });

    it('여러 번 호출 시 모든 응답을 캡처해야 한다', () => {
      // Given: CaptureResponse 데코레이터가 적용된 메서드
      class TestController {
        private callCount = 0;

        @CaptureResponse({ statusCode: 200 })
        testMethod(): any {
          this.callCount++;
          return {
            status: 200,
            data: { id: this.callCount },
          };
        }
      }

      const controller = new TestController();

      // When: 메서드를 여러 번 호출한다
      controller.testMethod();
      controller.testMethod();
      controller.testMethod();

      // Then: 모든 응답이 캡처되어야 한다
      const allCaptured = metadataStorage.getAllCapturedResponses(
        TestController.prototype,
        'testMethod',
        200
      );

      expect(allCaptured).toHaveLength(3);
      expect(allCaptured[0]?.body).toEqual({ id: 1 });
      expect(allCaptured[1]?.body).toEqual({ id: 2 });
      expect(allCaptured[2]?.body).toEqual({ id: 3 });
    });

    it('HTTP 응답 형식이 아닌 경우에도 처리할 수 있어야 한다', () => {
      // Given: 단순 객체를 반환하는 메서드
      class TestController {
        @CaptureResponse({ statusCode: 200 })
        testMethod(): any {
          return { id: 1, name: 'Direct Object' };
        }
      }

      const controller = new TestController();

      // When: 메서드를 실행한다
      const result = controller.testMethod();

      // Then: 객체가 그대로 반환되어야 한다
      expect(result).toEqual({ id: 1, name: 'Direct Object' });

      // Then: 캡처된 응답이 존재해야 한다
      const captured = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );
      expect(captured).toBeDefined();
    });

    it('async 메서드를 지원해야 한다', async () => {
      // Given: async 메서드
      class TestController {
        @CaptureResponse({ statusCode: 200 })
        async testMethod(): Promise<any> {
          return Promise.resolve({
            status: 200,
            data: { id: 1, name: 'Async Test' },
          });
        }
      }

      const controller = new TestController();

      // When: async 메서드를 실행한다
      const result = await controller.testMethod();

      // Then: Promise가 올바르게 처리되어야 한다
      expect(result).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ id: 1, name: 'Async Test' });

      // Then: 응답이 캡처되어야 한다
      const captured = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );
      expect(captured).toBeDefined();
      expect(captured?.body).toEqual({ id: 1, name: 'Async Test' });
    });
  });

  describe('Edge Cases', () => {
    it('메서드가 에러를 던지는 경우 에러를 전파해야 한다', () => {
      // Given: 에러를 던지는 메서드
      class TestController {
        @CaptureResponse({ statusCode: 500 })
        testMethod(): any {
          throw new Error('Test Error');
        }
      }

      const controller = new TestController();

      // When & Then: 에러가 전파되어야 한다
      expect(() => controller.testMethod()).toThrow('Test Error');
    });

    it('메서드가 undefined를 반환하는 경우를 처리해야 한다', () => {
      // Given: undefined를 반환하는 메서드
      class TestController {
        @CaptureResponse({ statusCode: 204 })
        testMethod(): any {
          return undefined;
        }
      }

      const controller = new TestController();

      // When: 메서드를 실행한다
      const result = controller.testMethod();

      // Then: undefined가 반환되어야 한다
      expect(result).toBeUndefined();

      // Then: 캡처가 시도되어야 한다 (undefined도 유효한 응답)
      const captured = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        204
      );
      expect(captured).toBeDefined();
    });

    it('메서드가 null을 반환하는 경우를 처리해야 한다', () => {
      // Given: null을 반환하는 메서드
      class TestController {
        @CaptureResponse({ statusCode: 204 })
        testMethod(): any {
          return null;
        }
      }

      const controller = new TestController();

      // When: 메서드를 실행한다
      const result = controller.testMethod();

      // Then: null이 반환되어야 한다
      expect(result).toBeNull();
    });

    it('동일 클래스의 여러 메서드에 적용할 수 있어야 한다', () => {
      // Given: 여러 메서드에 데코레이터가 적용된 클래스
      class TestController {
        @CaptureResponse({ statusCode: 200 })
        method1(): any {
          return { status: 200, data: { method: 'method1' } };
        }

        @CaptureResponse({ statusCode: 201 })
        method2(): any {
          return { status: 201, data: { method: 'method2' } };
        }
      }

      const controller = new TestController();

      // When: 각 메서드를 실행한다
      controller.method1();
      controller.method2();

      // Then: 각 메서드의 응답이 구분되어 캡처되어야 한다
      const captured1 = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'method1',
        200
      );
      const captured2 = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'method2',
        201
      );

      expect(captured1?.body).toEqual({ method: 'method1' });
      expect(captured2?.body).toEqual({ method: 'method2' });
    });

    it('상속된 메서드에도 적용되어야 한다', () => {
      // Given: 부모 클래스와 자식 클래스
      class BaseController {
        @CaptureResponse({ statusCode: 200 })
        baseMethod(): any {
          return { status: 200, data: { type: 'base' } };
        }
      }

      class ChildController extends BaseController {
        @CaptureResponse({ statusCode: 200 })
        childMethod(): any {
          return { status: 200, data: { type: 'child' } };
        }
      }

      const child = new ChildController();

      // When: 부모 메서드와 자식 메서드를 실행한다
      child.baseMethod();
      child.childMethod();

      // Then: 각각 캡처되어야 한다
      const baseCaptured = metadataStorage.getCapturedResponse(
        BaseController.prototype,
        'baseMethod',
        200
      );
      const childCaptured = metadataStorage.getCapturedResponse(
        ChildController.prototype,
        'childMethod',
        200
      );

      expect(baseCaptured?.body).toEqual({ type: 'base' });
      expect(childCaptured?.body).toEqual({ type: 'child' });
    });
  });

  describe('Integration with ResponseInterceptor', () => {
    it('ResponseInterceptor.capture를 사용하여 응답을 캡처해야 한다', () => {
      // Given: CaptureResponse 데코레이터가 적용된 메서드
      class TestController {
        @CaptureResponse({ statusCode: 200 })
        testMethod(): any {
          return {
            status: 200,
            data: { id: 1 },
            headers: { 'content-type': 'application/json' },
          };
        }
      }

      const controller = new TestController();

      // When: 메서드를 실행한다
      controller.testMethod();

      // Then: ResponseInterceptor를 통해 캡처되어야 한다
      const captured = metadataStorage.getCapturedResponse(
        TestController.prototype,
        'testMethod',
        200
      );

      expect(captured).toBeDefined();
      expect(captured?.statusCode).toBe(200);
      expect(captured?.body).toEqual({ id: 1 });
      expect(captured?.headers).toEqual({ 'content-type': 'application/json' });
      expect(captured?.timestamp).toBeGreaterThan(0);
    });
  });
});
