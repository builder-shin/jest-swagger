/**
 * NestJS 데코레이터 통합 테스트
 */

import 'reflect-metadata';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  createNestJSDocument,
} from '../../src/integrations/nestjs';

// 테스트용 컨트롤러 클래스
@ApiTags('users')
class TestController {
  @ApiOperation({ summary: '사용자 목록 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  getUsers() {
    return [];
  }

  @ApiOperation({ summary: '사용자 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  getUserById() {
    return null;
  }

  @ApiOperation({ summary: '사용자 생성' })
  @ApiBody({
    description: '사용자 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '생성됨' })
  createUser() {
    return null;
  }

  @ApiOperation({ summary: '사용자 검색' })
  @ApiQuery({ name: 'name', description: '이름으로 검색' })
  @ApiQuery({ name: 'email', description: '이메일로 검색', required: false })
  searchUsers() {
    return [];
  }
}

describe('NestJS 데코레이터 통합', () => {
  describe('ApiTags', () => {
    it('클래스에 태그 메타데이터를 추가해야 함', () => {
      const tags = Reflect.getMetadata('swagger:tags', TestController);
      expect(tags).toEqual(['users']);
    });
  });

  describe('ApiOperation', () => {
    it('메서드에 작업 메타데이터를 추가해야 함', () => {
      const operation = Reflect.getMetadata(
        'swagger:operation',
        TestController.prototype,
        'getUsers'
      );
      expect(operation).toEqual({ summary: '사용자 목록 조회' });
    });
  });

  describe('ApiResponse', () => {
    it('메서드에 응답 메타데이터를 추가해야 함', () => {
      const responses = Reflect.getMetadata(
        'swagger:responses',
        TestController.prototype,
        'getUsers'
      );
      expect(responses).toEqual({
        '200': { status: 200, description: '성공' },
      });
    });

    it('여러 응답을 지원해야 함', () => {
      const responses = Reflect.getMetadata(
        'swagger:responses',
        TestController.prototype,
        'getUserById'
      );
      expect(responses).toEqual({
        '200': { status: 200, description: '성공' },
        '404': { status: 404, description: '사용자를 찾을 수 없음' },
      });
    });
  });

  describe('ApiParam', () => {
    it('메서드에 파라미터 메타데이터를 추가해야 함', () => {
      const params = Reflect.getMetadata('swagger:params', TestController.prototype, 'getUserById');
      expect(params).toContainEqual({
        name: 'id',
        in: 'path',
        description: '사용자 ID',
        required: true,
      });
    });
  });

  describe('ApiQuery', () => {
    it('메서드에 쿼리 파라미터 메타데이터를 추가해야 함', () => {
      const params = Reflect.getMetadata('swagger:params', TestController.prototype, 'searchUsers');

      expect(params).toContainEqual({
        name: 'name',
        in: 'query',
        description: '이름으로 검색',
        required: true,
      });
    });

    it('선택적 쿼리 파라미터를 지원해야 함', () => {
      const params = Reflect.getMetadata('swagger:params', TestController.prototype, 'searchUsers');

      expect(params).toContainEqual({
        name: 'email',
        in: 'query',
        description: '이메일로 검색',
        required: false,
      });
    });
  });

  describe('ApiBody', () => {
    it('메서드에 요청 본문 메타데이터를 추가해야 함', () => {
      const body = Reflect.getMetadata('swagger:body', TestController.prototype, 'createUser');

      expect(body).toEqual({
        description: '사용자 정보',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
      });
    });
  });

  describe('createNestJSDocument', () => {
    it('컨트롤러에서 OpenAPI 문서를 생성해야 함', () => {
      const routes = [
        {
          path: '/users',
          method: 'GET',
          controller: TestController,
          handler: 'getUsers',
        },
        {
          path: '/users/:id',
          method: 'GET',
          controller: TestController,
          handler: 'getUserById',
        },
        {
          path: '/users',
          method: 'POST',
          controller: TestController,
          handler: 'createUser',
        },
        {
          path: '/users/search',
          method: 'GET',
          controller: TestController,
          handler: 'searchUsers',
        },
      ];

      const document = createNestJSDocument({
        title: 'Test API',
        version: '1.0.0',
        routes,
      });

      expect(document.openapi).toBe('3.0.0');
      expect(document.info.title).toBe('Test API');
      expect(document.paths['/users']).toBeDefined();
      expect(document.paths['/users']?.get).toBeDefined();
      expect(document.paths['/users']?.post).toBeDefined();
      expect(document.paths['/users/:id']?.get).toBeDefined();
    });

    it('태그를 문서에 포함해야 함', () => {
      const routes = [
        {
          path: '/users',
          method: 'GET',
          controller: TestController,
          handler: 'getUsers',
        },
      ];

      const document = createNestJSDocument({
        title: 'Test API',
        version: '1.0.0',
        routes,
      });

      expect(document.tags).toContainEqual({
        name: 'users',
      });
    });

    it('작업 요약을 포함해야 함', () => {
      const routes = [
        {
          path: '/users',
          method: 'GET',
          controller: TestController,
          handler: 'getUsers',
        },
      ];

      const document = createNestJSDocument({
        title: 'Test API',
        version: '1.0.0',
        routes,
      });

      expect(document.paths['/users']?.get?.summary).toBe('사용자 목록 조회');
    });

    it('파라미터를 포함해야 함', () => {
      const routes = [
        {
          path: '/users/:id',
          method: 'GET',
          controller: TestController,
          handler: 'getUserById',
        },
      ];

      const document = createNestJSDocument({
        title: 'Test API',
        version: '1.0.0',
        routes,
      });

      const params = document.paths['/users/:id']?.get?.parameters;
      expect(params).toBeDefined();
      expect(params).toContainEqual(
        expect.objectContaining({
          name: 'id',
          in: 'path',
        })
      );
    });
  });
});
