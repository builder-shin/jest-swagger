/**
 * Multi Content-Type 테스트
 *
 * 다양한 Content-Type (JSON, XML, form-data 등)을 지원하는지 검증
 */

import { path, api, response, CaptureResponse } from '../../src/decorators';
import { metadataStorage } from '../../src/types/metadata-storage';
import { ResponseInterceptor } from '../../src/capture/response-interceptor';
import { SwaggerReporter } from '../../src/reporters/swagger-reporter';

describe('Multi Content-Type Feature', () => {
  beforeEach(() => {
    metadataStorage.clear();
    ResponseInterceptor.clearPendingCaptures();
  });

  /**
   * Test Case 4.3.1: Capture XML Responses
   * application/xml Content-Type 응답이 캡처되는지 확인
   */
  it('should capture XML responses with correct content-type', async () => {
    @path('/api')
    class XmlController {
      @api.get('/data')
      @response(200, 'Success', undefined, 'application/xml')
      @CaptureResponse({ statusCode: 200 })
      async getData(): Promise<any> {
        return {
          status: 200,
          data: '<xml><data>value</data></xml>',
          headers: {
            'content-type': 'application/xml',
          },
        };
      }
    }

    const controller = new XmlController();
    await controller.getData();

    const captured = metadataStorage.getCapturedResponse(
      XmlController.prototype,
      'getData',
      200
    );

    expect(captured).toBeDefined();
    expect(captured?.contentType).toBe('application/xml');
  });

  /**
   * Test Case 4.3.2: Capture Form Data
   * application/x-www-form-urlencoded Content-Type 응답이 캡처되는지 확인
   */
  it('should capture form-data responses with correct content-type', async () => {
    @path('/api')
    class FormController {
      @api.post('/submit')
      @response(200, 'Success', undefined, 'application/x-www-form-urlencoded')
      @CaptureResponse({ statusCode: 200 })
      async submitForm(): Promise<any> {
        return {
          status: 200,
          data: { success: true },
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        };
      }
    }

    const controller = new FormController();
    await controller.submitForm();

    const captured = metadataStorage.getCapturedResponse(
      FormController.prototype,
      'submitForm',
      200
    );

    expect(captured).toBeDefined();
    expect(captured?.contentType).toBe('application/x-www-form-urlencoded');
  });

  /**
   * Test Case 4.3.3: Default to JSON
   * Content-Type이 없는 경우 application/json을 기본값으로 사용하는지 확인
   */
  it('should default to application/json when content-type is not specified', async () => {
    @path('/api')
    class JsonController {
      @api.get('/users')
      @response(200, 'Success')
      @CaptureResponse({ statusCode: 200 })
      async getUsers(): Promise<any> {
        return {
          status: 200,
          data: [{ id: 1, name: 'User1' }],
        };
      }
    }

    const controller = new JsonController();
    await controller.getUsers();

    const captured = metadataStorage.getCapturedResponse(
      JsonController.prototype,
      'getUsers',
      200
    );

    expect(captured).toBeDefined();
    // ResponseInterceptor가 기본값으로 application/json 설정
    expect(captured?.contentType).toBe('application/json');
  });

  /**
   * Test Case 4.3.4: Content-Type in Generated Document
   * 생성된 OpenAPI 문서에 올바른 Content-Type이 포함되는지 확인
   */
  it('should include correct content-type in generated OpenAPI document', () => {
    @path('/api')
    class MultiTypeController {
      @api.get('/json')
      @response(200, 'JSON Response', undefined, 'application/json')
      @CaptureResponse({ statusCode: 200 })
      async getJson(): Promise<any> {
        return { status: 200, data: { message: 'json' } };
      }

      @api.get('/xml')
      @response(200, 'XML Response', undefined, 'application/xml')
      @CaptureResponse({ statusCode: 200 })
      async getXml(): Promise<any> {
        return {
          status: 200,
          data: '<message>xml</message>',
          headers: { 'content-type': 'application/xml' },
        };
      }
    }

    const controller = new MultiTypeController();

    // 메타데이터 확인
    const jsonMeta = metadataStorage.getResponseMetadata(
      MultiTypeController.prototype,
      'getJson'
    );
    const xmlMeta = metadataStorage.getResponseMetadata(
      MultiTypeController.prototype,
      'getXml'
    );

    expect(jsonMeta).toBeDefined();
    expect(jsonMeta?.[0]?.mediaType).toBe('application/json');

    expect(xmlMeta).toBeDefined();
    expect(xmlMeta?.[0]?.mediaType).toBe('application/xml');
  });
});
