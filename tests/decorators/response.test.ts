/**
 * response 데코레이터 테스트
 */

import { response } from '../../src/decorators/response';
import { api } from '../../src/decorators/api';
import { metadataStorage } from '../../src/types/metadata-storage';
import { SchemaObject } from '../../src/types';

describe('response 데코레이터', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('기본 응답 설정', () => {
    it('상태 코드와 설명을 설정할 수 있어야 한다', () => {
      class UserController {
        @response(200, '성공')
        getUsers() {}
      }

      const metadata = metadataStorage.getResponseMetadata(UserController.prototype, 'getUsers');
      expect(metadata).toHaveLength(1);
      expect(metadata[0]?.statusCode).toBe(200);
      expect(metadata[0]?.description).toBe('성공');
    });

    it('스키마를 설정할 수 있어야 한다', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
      };

      class UserController {
        @response(200, '성공', schema)
        getUser() {}
      }

      const metadata = metadataStorage.getResponseMetadata(UserController.prototype, 'getUser');
      expect(metadata[0]?.schema).toEqual(schema);
    });

    it('미디어 타입을 설정할 수 있어야 한다', () => {
      class UserController {
        @response(200, '성공', { type: 'object' }, 'application/json')
        getUser() {}
      }

      const metadata = metadataStorage.getResponseMetadata(UserController.prototype, 'getUser');
      expect(metadata[0]?.mediaType).toBe('application/json');
    });

    it('미디어 타입 기본값은 application/json이어야 한다', () => {
      class UserController {
        @response(200, '성공')
        getUser() {}
      }

      const metadata = metadataStorage.getResponseMetadata(UserController.prototype, 'getUser');
      expect(metadata[0]?.mediaType).toBe('application/json');
    });
  });

  describe('여러 응답 설정', () => {
    it('하나의 메서드에 여러 응답을 설정할 수 있어야 한다', () => {
      class UserController {
        @response(200, '성공')
        @response(404, '찾을 수 없음')
        @response(500, '서버 오류')
        getUser() {}
      }

      const metadata = metadataStorage.getResponseMetadata(UserController.prototype, 'getUser');
      expect(metadata).toHaveLength(3);

      const statusCodes = metadata.map((m) => m.statusCode);
      expect(statusCodes).toContain(200);
      expect(statusCodes).toContain(404);
      expect(statusCodes).toContain(500);
    });

    it('각 응답마다 다른 스키마를 설정할 수 있어야 한다', () => {
      const successSchema: SchemaObject = { type: 'object' };
      const errorSchema: SchemaObject = {
        type: 'object',
        properties: { message: { type: 'string' } },
      };

      class UserController {
        @response(200, '성공', successSchema)
        @response(400, '잘못된 요청', errorSchema)
        createUser() {}
      }

      const metadata = metadataStorage.getResponseMetadata(UserController.prototype, 'createUser');
      expect(metadata).toHaveLength(2);

      const success = metadata.find((m) => m.statusCode === 200);
      const error = metadata.find((m) => m.statusCode === 400);

      expect(success?.schema).toEqual(successSchema);
      expect(error?.schema).toEqual(errorSchema);
    });
  });

  describe('스키마 타입', () => {
    it('배열 스키마를 지원해야 한다', () => {
      const schema: SchemaObject = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
        },
      };

      class UserController {
        @response(200, '성공', schema)
        getUsers() {}
      }

      const metadata = metadataStorage.getResponseMetadata(UserController.prototype, 'getUsers');
      expect(metadata[0]?.schema?.type).toBe('array');
      expect(metadata[0]?.schema?.items).toBeDefined();
    });

    it('원시 타입 스키마를 지원해야 한다', () => {
      class UserController {
        @response(200, '성공', { type: 'string' })
        getUserName() {}

        @response(200, '성공', { type: 'number' })
        getUserCount() {}

        @response(200, '성공', { type: 'boolean' })
        isActive() {}
      }

      const nameMeta = metadataStorage.getResponseMetadata(UserController.prototype, 'getUserName');
      expect(nameMeta[0]?.schema?.type).toBe('string');

      const countMeta = metadataStorage.getResponseMetadata(
        UserController.prototype,
        'getUserCount'
      );
      expect(countMeta[0]?.schema?.type).toBe('number');

      const activeMeta = metadataStorage.getResponseMetadata(UserController.prototype, 'isActive');
      expect(activeMeta[0]?.schema?.type).toBe('boolean');
    });
  });

  describe('통합 시나리오', () => {
    it('api 데코레이터와 함께 사용할 수 있어야 한다', () => {
      class UserController {
        @api.get({ summary: '사용자 목록' })
        @response(200, '성공', {
          type: 'array',
          items: { type: 'object' },
        })
        getUsers() {}
      }

      const apiMeta = metadataStorage.getApiMetadata(UserController.prototype, 'getUsers');
      const responseMeta = metadataStorage.getResponseMetadata(
        UserController.prototype,
        'getUsers'
      );

      expect(apiMeta?.method).toBe('get');
      expect(responseMeta).toHaveLength(1);
      expect(responseMeta[0]?.statusCode).toBe(200);
    });

    it('전형적인 CRUD 시나리오', () => {
      const userSchema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      };

      const errorSchema: SchemaObject = {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string' },
        },
      };

      class UserController {
        @api.get()
        @response(200, '성공', { type: 'array', items: userSchema })
        getUsers() {}

        @api.get('/:id')
        @response(200, '성공', userSchema)
        @response(404, '찾을 수 없음', errorSchema)
        getUser() {}

        @api.post()
        @response(201, '생성됨', userSchema)
        @response(400, '잘못된 요청', errorSchema)
        createUser() {}

        @api.put('/:id')
        @response(200, '성공', userSchema)
        @response(404, '찾을 수 없음', errorSchema)
        updateUser() {}

        @api.delete('/:id')
        @response(204, '삭제됨')
        @response(404, '찾을 수 없음', errorSchema)
        deleteUser() {}
      }

      // getUsers 검증
      const getUsersRes = metadataStorage.getResponseMetadata(UserController.prototype, 'getUsers');
      expect(getUsersRes).toHaveLength(1);

      // getUser 검증
      const getUserRes = metadataStorage.getResponseMetadata(UserController.prototype, 'getUser');
      expect(getUserRes).toHaveLength(2);

      // createUser 검증
      const createUserRes = metadataStorage.getResponseMetadata(
        UserController.prototype,
        'createUser'
      );
      expect(createUserRes).toHaveLength(2);
      const created = createUserRes.find((r) => r.statusCode === 201);
      expect(created?.description).toBe('생성됨');

      // deleteUser 검증
      const deleteUserRes = metadataStorage.getResponseMetadata(
        UserController.prototype,
        'deleteUser'
      );
      expect(deleteUserRes).toHaveLength(2);
      const deleted = deleteUserRes.find((r) => r.statusCode === 204);
      expect(deleted?.description).toBe('삭제됨');
    });
  });
});
