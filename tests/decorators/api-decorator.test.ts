/**
 * api 데코레이터 테스트
 */

import { api } from '../../src/decorators/api';
import { path } from '../../src/decorators/path';
import { response } from '../../src/decorators/response';
import { metadataStorage } from '../../src/types/metadata-storage';

describe('api 데코레이터', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('기본 HTTP 메서드', () => {
    it('GET 메서드를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.get()
        getUsers() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(metadata).toBeDefined();
      expect(metadata?.method).toBe('get');
    });

    it('POST 메서드를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.post()
        createUser() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'createUser');
      expect(metadata?.method).toBe('post');
    });

    it('PUT 메서드를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.put()
        updateUser() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'updateUser');
      expect(metadata?.method).toBe('put');
    });

    it('DELETE 메서드를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.delete()
        deleteUser() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'deleteUser');
      expect(metadata?.method).toBe('delete');
    });

    it('PATCH 메서드를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.patch()
        patchUser() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'patchUser');
      expect(metadata?.method).toBe('patch');
    });
  });

  describe('메서드별 경로', () => {
    it('메서드별 경로를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.get('/:id')
        getUser() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUser');
      expect(metadata?.path).toBe('/:id');
    });

    it('경로가 없으면 undefined여야 한다', () => {
      class UserController {
        @api.get()
        getUsers() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(metadata?.path).toBeUndefined();
    });
  });

  describe('설명 및 요약', () => {
    it('summary를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.get({ summary: '사용자 목록 조회' })
        getUsers() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(metadata?.summary).toBe('사용자 목록 조회');
    });

    it('description을 설정할 수 있어야 한다', () => {
      class UserController {
        @api.get({ description: '모든 사용자의 목록을 조회합니다.' })
        getUsers() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(metadata?.description).toBe('모든 사용자의 목록을 조회합니다.');
    });

    it('경로와 옵션을 동시에 설정할 수 있어야 한다', () => {
      class UserController {
        @api.get('/:id', { summary: '사용자 상세 조회' })
        getUser() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUser');
      expect(metadata?.path).toBe('/:id');
      expect(metadata?.summary).toBe('사용자 상세 조회');
    });
  });

  describe('태그', () => {
    it('단일 태그를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.get({ tags: ['users'] })
        getUsers() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(metadata?.tags).toEqual(['users']);
    });

    it('여러 태그를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.get({ tags: ['users', 'admin'] })
        getUsers() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(metadata?.tags).toEqual(['users', 'admin']);
    });
  });

  describe('deprecated', () => {
    it('deprecated를 설정할 수 있어야 한다', () => {
      class UserController {
        @api.get({ deprecated: true })
        getUsers() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(metadata?.deprecated).toBe(true);
    });

    it('기본값은 undefined여야 한다', () => {
      class UserController {
        @api.get()
        getUsers() {}
      }

      const metadata = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(metadata?.deprecated).toBeUndefined();
    });
  });

  describe('통합 시나리오', () => {
    it('path와 api 데코레이터를 함께 사용할 수 있어야 한다', () => {
      @path('/users')
      class UserController {
        @api.get({ summary: '사용자 목록' })
        getUsers() {}

        @api.get('/:id', { summary: '사용자 상세' })
        getUser() {}

        @api.post({ summary: '사용자 생성' })
        createUser() {}
      }

      const pathMeta = metadataStorage.getPathMetadata(UserController.prototype);
      expect(pathMeta?.path).toBe('/users');

      const getUsersMeta = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(getUsersMeta?.method).toBe('get');
      expect(getUsersMeta?.summary).toBe('사용자 목록');

      const getUserMeta = metadataStorage.getApiMetadata(UserController.prototype, 'getUser');
      expect(getUserMeta?.method).toBe('get');
      expect(getUserMeta?.path).toBe('/:id');
      expect(getUserMeta?.summary).toBe('사용자 상세');

      const createUserMeta = metadataStorage.getApiMetadata(UserController.prototype, 'createUser');
      expect(createUserMeta?.method).toBe('post');
    });

    it('response 데코레이터와 함께 사용할 수 있어야 한다', () => {
      class UserController {
        @api.get({ summary: '사용자 목록' })
        @response(200, '성공', {
          type: 'array',
          items: { type: 'object' },
        })
        getUsers() {}
      }

      const apiMeta = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      expect(apiMeta?.method).toBe('get');

      const responseMeta = metadataStorage.getResponseMetadata(
        UserController.prototype,
        'getUsers'
      );
      expect(responseMeta).toHaveLength(1);
      expect(responseMeta[0]?.statusCode).toBe(200);
    });
  });
});
