/**
 * 데코레이터 통합 테스트
 *
 * 모든 데코레이터가 함께 작동하는지 검증
 */

import { path, api, response, query, pathParam, header, body } from '../../src/decorators';
import { metadataStorage } from '../../src/types/metadata-storage';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('데코레이터 통합 테스트', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('REST API 시나리오', () => {
    it('완전한 REST API 컨트롤러를 정의할 수 있어야 한다', () => {
      @path('/api/users')
      class UserController {
        @api.get({ summary: '사용자 목록 조회', tags: ['users'] })
        @response(200, '성공', {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              email: { type: 'string' },
            },
          },
        })
        getUsers(
          @query('page', { description: '페이지 번호', schema: { type: 'integer', minimum: 1 } })
          page: number,
          @query('limit', { description: '페이지당 항목 수' })
          limit: number
        ) {}

        @api.get('/:id', { summary: '사용자 상세 조회', tags: ['users'] })
        @response(200, '성공', {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        })
        @response(404, '찾을 수 없음')
        getUser(@pathParam('id') id: number) {}

        @api.post({ summary: '사용자 생성', tags: ['users'] })
        @response(201, '생성됨')
        @response(400, '잘못된 요청')
        createUser(
          @body({
            description: '사용자 생성 데이터',
            required: true,
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
              required: ['name', 'email'],
            },
          })
          data: any
        ) {}

        @api.put('/:id', { summary: '사용자 수정', tags: ['users'] })
        @response(200, '성공')
        @response(404, '찾을 수 없음')
        updateUser(@pathParam('id') id: number, @body({ required: true }) data: any) {}

        @api.delete('/:id', { summary: '사용자 삭제', tags: ['users'] })
        @response(204, '삭제됨')
        @response(404, '찾을 수 없음')
        deleteUser(@pathParam('id') id: number) {}
      }

      // 경로 메타데이터 검증
      const pathMeta = metadataStorage.getPathMetadata(UserController.prototype);
      expect(pathMeta?.path).toBe('/api/users');

      // GET /users 검증
      const getUsersApi = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(getUsersApi?.method).toBe('get');
      expect(getUsersApi?.tags).toContain('users');

      const getUsersParams = metadataStorage.getParameterMetadata(
        UserController.prototype,
        'getUsers'
      );
      expect(getUsersParams).toHaveLength(2);

      const getUsersResponses = metadataStorage.getResponseMetadata(
        UserController.prototype,
        'getUsers'
      );
      expect(getUsersResponses).toHaveLength(1);

      // GET /users/:id 검증
      const getUserApi = metadataStorage.getApiMetadata(UserController.prototype, 'getUser');
      expect(getUserApi?.method).toBe('get');
      expect(getUserApi?.path).toBe('/:id');

      const getUserParams = metadataStorage.getParameterMetadata(
        UserController.prototype,
        'getUser'
      );
      expect(getUserParams).toHaveLength(1);
      expect(getUserParams[0]?.in).toBe('path');

      const getUserResponses = metadataStorage.getResponseMetadata(
        UserController.prototype,
        'getUser'
      );
      expect(getUserResponses).toHaveLength(2);

      // POST /users 검증
      const createUserApi = metadataStorage.getApiMetadata(UserController.prototype, 'createUser');
      expect(createUserApi?.method).toBe('post');

      const createUserBody = metadataStorage.getRequestBodyMetadata(
        UserController.prototype,
        'createUser'
      );
      expect(createUserBody?.required).toBe(true);

      // PUT /users/:id 검증
      const updateUserApi = metadataStorage.getApiMetadata(UserController.prototype, 'updateUser');
      expect(updateUserApi?.method).toBe('put');

      // DELETE /users/:id 검증
      const deleteUserApi = metadataStorage.getApiMetadata(UserController.prototype, 'deleteUser');
      expect(deleteUserApi?.method).toBe('delete');

      const deleteUserResponses = metadataStorage.getResponseMetadata(
        UserController.prototype,
        'deleteUser'
      );
      expect(deleteUserResponses.find((r) => r.statusCode === 204)).toBeDefined();
    });
  });

  describe('중첩 경로 시나리오', () => {
    it('중첩된 라우터 구조를 지원해야 한다', () => {
      @path('/api')
      class ApiController {}

      @path('/v1')
      class V1Controller extends ApiController {}

      @path('/users')
      class UserController extends V1Controller {
        @api.get({ summary: '사용자 목록' })
        getUsers() {}
      }

      const userMeta = metadataStorage.getPathMetadata(UserController.prototype);
      expect(userMeta?.path).toBe('/users');
      expect(userMeta?.basePath).toBe('/api/v1');
    });
  });

  describe('인증 시나리오', () => {
    it('인증이 필요한 API를 정의할 수 있어야 한다', () => {
      @path('/api/admin')
      class AdminController {
        @api.get({ summary: '관리자 대시보드', tags: ['admin'] })
        @response(200, '성공')
        @response(401, '인증 실패')
        @response(403, '권한 없음')
        getDashboard(
          @header('Authorization', {
            description: 'Bearer 토큰',
            required: true,
            schema: { type: 'string', pattern: '^Bearer .+$' },
          })
          auth: string
        ) {}
      }

      const apiMeta = metadataStorage.getApiMetadata(AdminController.prototype, 'getDashboard');
      expect(apiMeta?.tags).toContain('admin');

      const params = metadataStorage.getParameterMetadata(
        AdminController.prototype,
        'getDashboard'
      );
      const authHeader = params.find((p) => p.name === 'Authorization');
      expect(authHeader?.required).toBe(true);

      const responses = metadataStorage.getResponseMetadata(
        AdminController.prototype,
        'getDashboard'
      );
      expect(responses).toHaveLength(3);
    });
  });

  describe('복잡한 쿼리 시나리오', () => {
    it('복잡한 필터링과 정렬을 지원해야 한다', () => {
      @path('/api/products')
      class ProductController {
        @api.get({ summary: '상품 검색' })
        @response(200, '성공')
        search(
          @query('q', { description: '검색어' }) q?: string,
          @query('category', { description: '카테고리' }) category?: string,
          @query('minPrice', { schema: { type: 'number', minimum: 0 } }) minPrice?: number,
          @query('maxPrice', { schema: { type: 'number', minimum: 0 } }) maxPrice?: number,
          @query('sort', { schema: { type: 'string', enum: ['price', 'name', 'date'] } })
          sort?: string,
          @query('order', { schema: { type: 'string', enum: ['asc', 'desc'] } }) order?: string,
          @query('page', { schema: { type: 'integer', minimum: 1 } }) page?: number,
          @query('limit', { schema: { type: 'integer', minimum: 1, maximum: 100 } })
          limit?: number
        ) {}
      }

      const params = metadataStorage.getParameterMetadata(ProductController.prototype, 'search');
      expect(params).toHaveLength(8);

      const sortParam = params.find((p) => p.name === 'sort');
      expect(sortParam?.schema?.enum).toEqual(['price', 'name', 'date']);
    });
  });

  describe('deprecated API 시나리오', () => {
    it('deprecated된 API를 표시할 수 있어야 한다', () => {
      @path('/api/legacy')
      class LegacyController {
        @api.get({ summary: '구버전 API', deprecated: true })
        @response(200, '성공')
        oldEndpoint() {}

        @api.get('/v2', { summary: '신버전 API' })
        @response(200, '성공')
        newEndpoint() {}
      }

      const oldApi = metadataStorage.getApiMetadata(LegacyController.prototype, 'oldEndpoint');
      expect(oldApi?.deprecated).toBe(true);

      const newApi = metadataStorage.getApiMetadata(LegacyController.prototype, 'newEndpoint');
      expect(newApi?.deprecated).toBeUndefined();
    });
  });
});
