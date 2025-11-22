/**
 * 파라미터 데코레이터 테스트
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { query, pathParam, header, cookie } from '../../src/decorators/parameters';
import { api } from '../../src/decorators/api';
import { metadataStorage } from '../../src/types/metadata-storage';

describe('파라미터 데코레이터', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('query 데코레이터', () => {
    it('쿼리 파라미터를 설정할 수 있어야 한다', () => {
      class UserController {
        getUsers(@query('page') page: number) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata).toHaveLength(1);
      expect(metadata[0]?.name).toBe('page');
      expect(metadata[0]?.in).toBe('query');
    });

    it('쿼리 파라미터에 설명을 추가할 수 있어야 한다', () => {
      class UserController {
        getUsers(@query('page', { description: '페이지 번호' }) page: number) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata[0]?.description).toBe('페이지 번호');
    });

    it('쿼리 파라미터를 필수로 설정할 수 있어야 한다', () => {
      class UserController {
        getUsers(@query('search', { required: true }) search: string) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata[0]?.required).toBe(true);
    });

    it('쿼리 파라미터에 스키마를 설정할 수 있어야 한다', () => {
      class UserController {
        getUsers(
          @query('limit', {
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          })
          limit: number
        ) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata[0]?.schema?.type).toBe('integer');
      expect(metadata[0]?.schema?.minimum).toBe(1);
      expect(metadata[0]?.schema?.maximum).toBe(100);
    });

    it('여러 쿼리 파라미터를 설정할 수 있어야 한다', () => {
      class UserController {
        getUsers(
          @query('page') page: number,
          @query('limit') limit: number,
          @query('search') search: string
        ) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata).toHaveLength(3);
      expect(metadata[0]?.name).toBe('page');
      expect(metadata[1]?.name).toBe('limit');
      expect(metadata[2]?.name).toBe('search');
    });
  });

  describe('pathParam 데코레이터', () => {
    it('경로 파라미터를 설정할 수 있어야 한다', () => {
      class UserController {
        getUser(@pathParam('id') id: number) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUser');
      expect(metadata).toHaveLength(1);
      expect(metadata[0]?.name).toBe('id');
      expect(metadata[0]?.in).toBe('path');
    });

    it('경로 파라미터는 기본적으로 필수여야 한다', () => {
      class UserController {
        getUser(@pathParam('id') id: number) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUser');
      expect(metadata[0]?.required).toBe(true);
    });

    it('여러 경로 파라미터를 설정할 수 있어야 한다', () => {
      class UserController {
        getUserPost(@pathParam('userId') userId: number, @pathParam('postId') postId: number) {}
      }

      const metadata = metadataStorage.getParameterMetadata(
        UserController.prototype,
        'getUserPost'
      );
      expect(metadata).toHaveLength(2);
      expect(metadata[0]?.name).toBe('userId');
      expect(metadata[1]?.name).toBe('postId');
    });
  });

  describe('header 데코레이터', () => {
    it('헤더 파라미터를 설정할 수 있어야 한다', () => {
      class UserController {
        getUsers(@header('Authorization') auth: string) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata).toHaveLength(1);
      expect(metadata[0]?.name).toBe('Authorization');
      expect(metadata[0]?.in).toBe('header');
    });

    it('헤더 파라미터에 설명을 추가할 수 있어야 한다', () => {
      class UserController {
        getUsers(
          @header('X-API-Key', { description: 'API 인증 키' })
          apiKey: string
        ) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata[0]?.description).toBe('API 인증 키');
    });
  });

  describe('cookie 데코레이터', () => {
    it('쿠키 파라미터를 설정할 수 있어야 한다', () => {
      class UserController {
        getUsers(@cookie('sessionId') sessionId: string) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata).toHaveLength(1);
      expect(metadata[0]?.name).toBe('sessionId');
      expect(metadata[0]?.in).toBe('cookie');
    });
  });

  describe('통합 시나리오', () => {
    it('다양한 파라미터를 함께 사용할 수 있어야 한다', () => {
      class UserController {
        @api.get('/:id')
        getUser(
          @pathParam('id') id: number,
          @query('include', { description: '포함할 필드' }) include: string,
          @header('Authorization') auth: string
        ) {}
      }

      const apiMeta = metadataStorage.getApiMetadata(UserController.prototype, 'getUser');
      expect(apiMeta?.method).toBe('get');
      expect(apiMeta?.path).toBe('/:id');

      const paramMeta = metadataStorage.getParameterMetadata(UserController.prototype, 'getUser');
      expect(paramMeta).toHaveLength(3);

      const pathParamMeta = paramMeta.find((p) => p.in === 'path');
      const queryParam = paramMeta.find((p) => p.in === 'query');
      const headerParam = paramMeta.find((p) => p.in === 'header');

      expect(pathParamMeta?.name).toBe('id');
      expect(queryParam?.name).toBe('include');
      expect(headerParam?.name).toBe('Authorization');
    });

    it('전형적인 페이지네이션 시나리오', () => {
      class UserController {
        @api.get({ summary: '사용자 목록 조회' })
        getUsers(
          @query('page', {
            description: '페이지 번호',
            schema: { type: 'integer', minimum: 1, default: 1 },
          })
          page: number,
          @query('limit', {
            description: '페이지당 항목 수',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          })
          limit: number,
          @query('sort', {
            description: '정렬 기준',
            schema: { type: 'string', enum: ['asc', 'desc'] },
          })
          sort?: string,
          @query('search', { description: '검색어' }) search?: string
        ) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'getUsers');
      expect(metadata).toHaveLength(4);

      const page = metadata.find((p) => p.name === 'page');
      expect(page?.schema?.minimum).toBe(1);
      expect(page?.schema?.default).toBe(1);

      const limit = metadata.find((p) => p.name === 'limit');
      expect(limit?.schema?.maximum).toBe(100);

      const sort = metadata.find((p) => p.name === 'sort');
      expect(sort?.schema?.enum).toEqual(['asc', 'desc']);
    });

    it('인증이 필요한 엔드포인트', () => {
      class UserController {
        @api.post({ summary: '사용자 생성', tags: ['users', 'admin'] })
        createUser(
          @header('Authorization', {
            description: 'Bearer 토큰',
            required: true,
            schema: { type: 'string', pattern: '^Bearer .+$' },
          })
          auth: string,
          @header('X-Request-ID', { description: '요청 추적 ID' }) requestId?: string
        ) {}
      }

      const metadata = metadataStorage.getParameterMetadata(UserController.prototype, 'createUser');
      expect(metadata).toHaveLength(2);

      const authHeader = metadata.find((p) => p.name === 'Authorization');
      expect(authHeader?.required).toBe(true);
      expect(authHeader?.schema?.pattern).toBe('^Bearer .+$');

      const requestIdHeader = metadata.find((p) => p.name === 'X-Request-ID');
      expect(requestIdHeader?.required).toBeUndefined();
    });

    it('복잡한 필터링 시나리오', () => {
      class ProductController {
        @api.get({ summary: '상품 검색' })
        searchProducts(
          @query('category', { description: '카테고리 필터' }) category?: string,
          @query('minPrice', {
            description: '최소 가격',
            schema: { type: 'number', minimum: 0 },
          })
          minPrice?: number,
          @query('maxPrice', {
            description: '최대 가격',
            schema: { type: 'number', minimum: 0 },
          })
          maxPrice?: number,
          @query('tags', {
            description: '태그 필터 (쉼표로 구분)',
            schema: { type: 'string' },
          })
          tags?: string,
          @query('inStock', {
            description: '재고 있는 상품만',
            schema: { type: 'boolean' },
          })
          inStock?: boolean
        ) {}
      }

      const metadata = metadataStorage.getParameterMetadata(
        ProductController.prototype,
        'searchProducts'
      );
      expect(metadata).toHaveLength(5);

      const minPrice = metadata.find((p) => p.name === 'minPrice');
      expect(minPrice?.schema?.type).toBe('number');

      const inStock = metadata.find((p) => p.name === 'inStock');
      expect(inStock?.schema?.type).toBe('boolean');
    });
  });
});
