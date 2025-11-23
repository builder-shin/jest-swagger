/**
 * SwaggerReporter 개선 테스트
 * 캡처된 실제 응답을 OpenAPI 문서의 example로 포함하는 기능 검증
 */

import { SwaggerReporter } from '../../src/reporters/swagger-reporter';
import { metadataStorage } from '../../src/types/metadata-storage';
import { CapturedResponse } from '../../src/capture/response-interceptor';
import { ApiMetadata } from '../../src/types/decorator.types';
import * as fs from 'fs';
import * as path from 'path';

describe('SwaggerReporter Enhanced - Captured Response Integration', () => {
  // Helper function to create mock TestResults
  const createMockResults = () => ({
    success: true,
    numTotalTests: 1,
    numPassedTests: 1,
    numFailedTests: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    testResults: [],
    startTime: Date.now(),
  });
  let reporter: SwaggerReporter;
  const testOutputDir = path.join(__dirname, '../../test-output-enhanced');

  beforeEach(() => {
    // 메타데이터 초기화
    metadataStorage.clear();

    // Reporter 초기화
    reporter = new SwaggerReporter({
      outputDir: testOutputDir,
      filename: 'test-enhanced',
      format: 'json',
      overwrite: true,
      collectMetadata: true,
      onlyAfterAllTests: true, // 모든 테스트 완료 후에 문서 생성
    });

    // 출력 디렉토리 생성
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // 테스트 파일 정리
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('Test Case 3.1.1: Generate Document with Captured Examples', () => {
    it('캡처된 응답을 example로 포함해야 함', async () => {
      // Given: 테스트 클래스와 메타데이터 설정
      class TestController {}
      const target = TestController.prototype;
      const propertyKey = 'getUser';

      // API 메타데이터 설정
      metadataStorage.setApiMetadata(target, propertyKey, {
        method: 'get',
        path: '/users/{id}',
        summary: 'Get user by ID',
        tags: ['users'],
        target,
        propertyKey,
      });

      // Path 메타데이터 설정 (프로토타입에 설정)
      metadataStorage.setPathMetadata(target, {
        path: '/api',
      });

      // 응답 메타데이터 설정 (스키마 포함)
      metadataStorage.addResponseMetadata(target, propertyKey, {
        statusCode: 200,
        description: 'User found',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
          required: ['id', 'name', 'email'],
        },
        mediaType: 'application/json',
      });

      // 캡처된 실제 응답 저장
      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
        },
        headers: {
          'content-type': 'application/json',
        },
        contentType: 'application/json',
        timestamp: Date.now(),
      };

      metadataStorage.setCapturedResponse(target, propertyKey, 200, capturedResponse);

      // When: 문서 생성
      await reporter.onRunComplete(new Set(), createMockResults() as any);

      // Then: 생성된 문서 검증
      const filePath = path.join(testOutputDir, 'test-enhanced.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const documentContent = fs.readFileSync(filePath, 'utf-8');
      const document = JSON.parse(documentContent);

      // 경로가 생성되었는지 확인
      expect(document.paths).toBeDefined();
      expect(document.paths['/api/users/{id}']).toBeDefined();
      expect(document.paths['/api/users/{id}'].get).toBeDefined();

      // 응답이 생성되었는지 확인
      const response = document.paths['/api/users/{id}'].get.responses['200'];
      expect(response).toBeDefined();
      expect(response.description).toBe('User found');

      // 스키마가 포함되었는지 확인
      expect(response.content).toBeDefined();
      expect(response.content['application/json']).toBeDefined();
      expect(response.content['application/json'].schema).toBeDefined();

      // example이 캡처된 응답으로 포함되었는지 확인
      expect(response.content['application/json'].example).toBeDefined();
      expect(response.content['application/json'].example).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('스키마가 없는 경우 캡처된 응답에서 자동 추론해야 함', async () => {
      // Given: 스키마 없이 응답 메타데이터만 설정
      class TestController {}
      const target = TestController.prototype;
      const propertyKey = 'createUser';

      metadataStorage.setApiMetadata(target, propertyKey, {
        method: 'post',
        path: '/users',
        summary: 'Create user',
        tags: ['users'],
        target,
        propertyKey,
      });

      metadataStorage.setPathMetadata(target, {
        path: '/api',
      });

      // 스키마 없이 응답 메타데이터 설정
      metadataStorage.addResponseMetadata(target, propertyKey, {
        statusCode: 201,
        description: 'User created',
        // schema 없음
        mediaType: 'application/json',
      });

      // 캡처된 응답 저장
      const capturedResponse: CapturedResponse = {
        statusCode: 201,
        body: {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        headers: {
          'content-type': 'application/json',
        },
        contentType: 'application/json',
        timestamp: Date.now(),
      };

      metadataStorage.setCapturedResponse(target, propertyKey, 201, capturedResponse);

      // When: 문서 생성
      await reporter.onRunComplete(new Set(), createMockResults() as any);

      // Then: 스키마가 자동 추론되었는지 확인
      const filePath = path.join(testOutputDir, 'test-enhanced.json');
      const documentContent = fs.readFileSync(filePath, 'utf-8');
      const document = JSON.parse(documentContent);

      const response = document.paths['/api/users'].post.responses['201'];
      expect(response).toBeDefined();

      // 스키마가 자동 추론되었는지 확인
      const schema = response.content['application/json'].schema;
      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.properties.id).toBeDefined();
      expect(schema.properties.name).toBeDefined();
      expect(schema.properties.email).toBeDefined();
      expect(schema.properties.createdAt).toBeDefined();

      // example도 포함되었는지 확인
      expect(response.content['application/json'].example).toEqual(capturedResponse.body);
    });
  });

  describe('Test Case 3.1.2: Handle Multiple Captured Responses', () => {
    it('여러 응답이 캡처된 경우 첫 번째 응답을 example로 사용해야 함', async () => {
      // Given: 동일 엔드포인트에 대해 여러 응답 캡처
      class TestController {}
      const target = TestController.prototype;
      const propertyKey = 'searchUsers';

      metadataStorage.setApiMetadata(target, propertyKey, {
        method: 'get',
        path: '/users',
        summary: 'Search users',
        tags: ['users'],
        target,
        propertyKey,
      });

      metadataStorage.setPathMetadata(target, {
        path: '/api',
      });

      metadataStorage.addResponseMetadata(target, propertyKey, {
        statusCode: 200,
        description: 'Users found',
        mediaType: 'application/json',
      });

      // 첫 번째 캡처된 응답
      const firstResponse: CapturedResponse = {
        statusCode: 200,
        body: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
        headers: { 'content-type': 'application/json' },
        contentType: 'application/json',
        timestamp: Date.now(),
      };

      // 두 번째 캡처된 응답
      const secondResponse: CapturedResponse = {
        statusCode: 200,
        body: [
          { id: 3, name: 'User 3' },
          { id: 4, name: 'User 4' },
          { id: 5, name: 'User 5' },
        ],
        headers: { 'content-type': 'application/json' },
        contentType: 'application/json',
        timestamp: Date.now() + 1000,
      };

      metadataStorage.setCapturedResponse(target, propertyKey, 200, firstResponse);
      metadataStorage.setCapturedResponse(target, propertyKey, 200, secondResponse);

      // When: 문서 생성
      await reporter.onRunComplete(new Set(), createMockResults() as any);

      // Then: 첫 번째 응답이 example로 사용되었는지 확인
      const filePath = path.join(testOutputDir, 'test-enhanced.json');
      const documentContent = fs.readFileSync(filePath, 'utf-8');
      const document = JSON.parse(documentContent);

      const response = document.paths['/api/users'].get.responses['200'];
      // 여러 응답이 캡처된 경우 examples (복수형) 사용
      expect(response.content['application/json'].examples).toBeDefined();
      expect(response.content['application/json'].examples.example1.value).toEqual(
        firstResponse.body
      );
      expect(response.content['application/json'].examples.example2.value).toEqual(
        secondResponse.body
      );
    });
  });

  describe('Test Case 3.1.3: Fallback to Decorator Metadata Only', () => {
    it('캡처된 응답이 없는 경우 기존 방식대로 동작해야 함', async () => {
      // Given: 캡처된 응답 없이 데코레이터 메타데이터만 설정
      class TestController {}
      const target = TestController.prototype;
      const propertyKey = 'deleteUser';

      metadataStorage.setApiMetadata(target, propertyKey, {
        method: 'delete',
        path: '/users/{id}',
        summary: 'Delete user',
        tags: ['users'],
        target,
        propertyKey,
      });

      metadataStorage.setPathMetadata(target, {
        path: '/api',
      });

      metadataStorage.addResponseMetadata(target, propertyKey, {
        statusCode: 204,
        description: 'User deleted',
        // schema 없음 (204 No Content)
      });

      // 캡처된 응답 없음

      // When: 문서 생성
      await reporter.onRunComplete(new Set(), createMockResults() as any);

      // Then: 기본 응답 구조만 생성되어야 함
      const filePath = path.join(testOutputDir, 'test-enhanced.json');
      const documentContent = fs.readFileSync(filePath, 'utf-8');
      const document = JSON.parse(documentContent);

      const response = document.paths['/api/users/{id}'].delete.responses['204'];
      expect(response).toBeDefined();
      expect(response.description).toBe('User deleted');
      // content가 없어야 함 (204 No Content는 본문 없음)
      expect(response.content).toBeUndefined();
    });
  });

  describe('Test Case 3.1.4: Schema Priority', () => {
    it('데코레이터 스키마가 있으면 그것을 우선 사용하고 example은 캡처된 응답 사용', async () => {
      // Given: 데코레이터 스키마와 캡처된 응답 모두 존재
      class TestController {}
      const target = TestController.prototype;
      const propertyKey = 'updateUser';

      metadataStorage.setApiMetadata(target, propertyKey, {
        method: 'put',
        path: '/users/{id}',
        summary: 'Update user',
        tags: ['users'],
        target,
        propertyKey,
      });

      metadataStorage.setPathMetadata(target, {
        path: '/api',
      });

      // 명시적 스키마 정의
      const definedSchema = {
        type: 'object' as const,
        properties: {
          id: { type: 'integer' as const },
          name: { type: 'string' as const },
          email: { type: 'string' as const, format: 'email' },
          updatedAt: { type: 'string' as const, format: 'date-time' },
        },
        required: ['id', 'name', 'email', 'updatedAt'],
      };

      metadataStorage.addResponseMetadata(target, propertyKey, {
        statusCode: 200,
        description: 'User updated',
        schema: definedSchema,
        mediaType: 'application/json',
      });

      // 캡처된 응답 (스키마와 다른 추가 필드 포함)
      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Updated Name',
          email: 'updated@example.com',
          updatedAt: '2024-01-01T12:00:00.000Z',
          extraField: 'should not affect schema', // 추가 필드
        },
        headers: { 'content-type': 'application/json' },
        contentType: 'application/json',
        timestamp: Date.now(),
      };

      metadataStorage.setCapturedResponse(target, propertyKey, 200, capturedResponse);

      // When: 문서 생성
      await reporter.onRunComplete(new Set(), createMockResults() as any);

      // Then: 데코레이터 스키마 사용, example은 캡처된 응답 사용
      const filePath = path.join(testOutputDir, 'test-enhanced.json');
      const documentContent = fs.readFileSync(filePath, 'utf-8');
      const document = JSON.parse(documentContent);

      const response = document.paths['/api/users/{id}'].put.responses['200'];

      // 스키마는 데코레이터에서 정의한 것 사용
      expect(response.content['application/json'].schema).toEqual(definedSchema);

      // example은 캡처된 응답 전체 사용 (extraField 포함)
      expect(response.content['application/json'].example).toEqual(capturedResponse.body);
    });

    it('데코레이터 스키마가 없으면 자동 추론하고 example도 캡처된 응답 사용', async () => {
      // Given: 스키마 없이 캡처된 응답만 존재
      class TestController {}
      const target = TestController.prototype;
      const propertyKey = 'patchUser';

      metadataStorage.setApiMetadata(target, propertyKey, {
        method: 'patch',
        path: '/users/{id}',
        summary: 'Patch user',
        tags: ['users'],
        target,
        propertyKey,
      });

      metadataStorage.setPathMetadata(target, {
        path: '/api',
      });

      metadataStorage.addResponseMetadata(target, propertyKey, {
        statusCode: 200,
        description: 'User patched',
        // schema 없음
        mediaType: 'application/json',
      });

      const capturedResponse: CapturedResponse = {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Patched Name',
        },
        headers: { 'content-type': 'application/json' },
        contentType: 'application/json',
        timestamp: Date.now(),
      };

      metadataStorage.setCapturedResponse(target, propertyKey, 200, capturedResponse);

      // When: 문서 생성
      await reporter.onRunComplete(new Set(), createMockResults() as any);

      // Then: 스키마 자동 추론 및 example 포함
      const filePath = path.join(testOutputDir, 'test-enhanced.json');
      const documentContent = fs.readFileSync(filePath, 'utf-8');
      const document = JSON.parse(documentContent);

      const response = document.paths['/api/users/{id}'].patch.responses['200'];

      // 스키마 자동 추론
      const schema = response.content['application/json'].schema;
      expect(schema.type).toBe('object');
      expect(schema.properties.id).toBeDefined();
      expect(schema.properties.name).toBeDefined();

      // example 포함
      expect(response.content['application/json'].example).toEqual(capturedResponse.body);
    });
  });
});
