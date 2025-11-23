/**
 * Error Response Capture 테스트
 *
 * @CaptureResponse 데코레이터가 성공 응답뿐만 아니라
 * 4xx, 5xx 에러 응답도 캡처하여 문서화하는지 검증
 *
 * 참고: 이 기능은 이미 구현되어 있으므로, 사용 예제 및 검증 테스트만 작성
 */

import { path, api, response, CaptureResponse } from '../../src/decorators';
import { metadataStorage } from '../../src/types/metadata-storage';
import { ResponseInterceptor } from '../../src/capture/response-interceptor';

describe('Error Response Capture Feature', () => {
  // 각 테스트 전에 메타데이터 초기화
  beforeEach(() => {
    metadataStorage.clear();
    ResponseInterceptor.clearPendingCaptures();
  });

  /**
   * Test Case 4.2.1: Capture 404 Error Response
   * 404 에러 응답이 캡처되는지 확인
   */
  it('should capture 404 error responses using @CaptureResponse decorator', async () => {
    @path('/users')
    class UserController {
      @api.get('/:id')
      @response.notFound('User not found', {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'number' },
        },
      })
      @CaptureResponse({ statusCode: 404 })
      async getUserById(): Promise<any> {
        // 404 에러 응답 시뮬레이션
        return {
          status: 404,
          data: {
            error: 'User not found',
            code: 404,
          },
        };
      }
    }

    // 테스트 실행
    const controller = new UserController();
    await controller.getUserById();

    // 캡처된 404 응답 확인
    const capturedResponse = metadataStorage.getCapturedResponse(
      UserController.prototype,
      'getUserById',
      404
    );

    expect(capturedResponse).toBeDefined();
    expect(capturedResponse?.statusCode).toBe(404);
    expect(capturedResponse?.body).toEqual({
      error: 'User not found',
      code: 404,
    });
  });

  /**
   * Test Case 4.2.2: Multiple Response Metadata Definitions
   * 여러 에러 코드에 대한 응답 메타데이터가 정의되는지 확인
   */
  it('should define multiple error response metadata (200, 400, 404, 500)', () => {
    @path('/api/posts')
    class PostController {
      @api.get('/:id')
      @response(200, 'Success', {
        type: 'object',
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
        },
      })
      @response.badRequest('Bad Request', {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      })
      @response.notFound('Not Found', {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      })
      @response.internalServerError('Internal Server Error', {
        type: 'object',
        properties: {
          error: { type: 'string' },
          stack: { type: 'string' },
        },
      })
      async getPost(): Promise<any> {
        return { status: 200, data: { id: 1, title: 'Test' } };
      }
    }

    // 응답 메타데이터 조회
    const responseMetadata = metadataStorage.getResponseMetadata(
      PostController.prototype,
      'getPost'
    );

    expect(responseMetadata).toBeDefined();
    expect(responseMetadata).toHaveLength(4); // 200, 400, 404, 500

    // 200 OK
    const ok = responseMetadata?.find((meta) => meta.statusCode === 200);
    expect(ok).toBeDefined();
    expect(ok?.description).toBe('Success');

    // 400 Bad Request
    const badRequest = responseMetadata?.find((meta) => meta.statusCode === 400);
    expect(badRequest).toBeDefined();
    expect(badRequest?.description).toBe('Bad Request');

    // 404 Not Found
    const notFound = responseMetadata?.find((meta) => meta.statusCode === 404);
    expect(notFound).toBeDefined();
    expect(notFound?.description).toBe('Not Found');

    // 500 Internal Server Error
    const serverError = responseMetadata?.find((meta) => meta.statusCode === 500);
    expect(serverError).toBeDefined();
    expect(serverError?.description).toBe('Internal Server Error');
  });

  /**
   * Test Case 4.2.3: Content-Type Capture for Error Responses
   * 에러 응답의 Content-Type이 올바르게 캡처되는지 확인
   */
  it('should capture content-type header for error responses', async () => {
    @path('/api')
    class TestController {
      @api.get('/error')
      @response.badRequest('Bad Request')
      @CaptureResponse({ statusCode: 400 })
      async getError(): Promise<any> {
        return {
          status: 400,
          data: { error: 'Bad request' },
          headers: {
            'content-type': 'application/json',
          },
        };
      }
    }

    const controller = new TestController();
    await controller.getError();

    const captured = metadataStorage.getCapturedResponse(TestController.prototype, 'getError', 400);

    expect(captured).toBeDefined();
    expect(captured?.statusCode).toBe(400);
    expect(captured?.contentType).toBe('application/json');
  });

  /**
   * Test Case 4.2.4: Response Metadata Storage for Errors
   * 에러 응답 메타데이터가 올바르게 저장되는지 확인
   */
  it('should store error response metadata correctly', () => {
    @path('/api')
    class ApiController {
      @api.get('/resource')
      @response.ok('Success')
      @response.unauthorized('Unauthorized', {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      })
      @response.forbidden('Forbidden', {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      })
      getResource(): void {
        // 메타데이터만 확인하는 테스트
      }
    }

    // 응답 메타데이터 조회
    const responseMetadata = metadataStorage.getResponseMetadata(
      ApiController.prototype,
      'getResource'
    );

    expect(responseMetadata).toBeDefined();
    expect(responseMetadata).toHaveLength(3); // 200, 401, 403

    // 200 OK
    const ok = responseMetadata?.find((meta) => meta.statusCode === 200);
    expect(ok).toBeDefined();
    expect(ok?.description).toBe('Success');

    // 401 Unauthorized
    const unauthorized = responseMetadata?.find((meta) => meta.statusCode === 401);
    expect(unauthorized).toBeDefined();
    expect(unauthorized?.description).toBe('Unauthorized');
    expect(unauthorized?.schema).toBeDefined();

    // 403 Forbidden
    const forbidden = responseMetadata?.find((meta) => meta.statusCode === 403);
    expect(forbidden).toBeDefined();
    expect(forbidden?.description).toBe('Forbidden');
    expect(forbidden?.schema).toBeDefined();
  });
});
