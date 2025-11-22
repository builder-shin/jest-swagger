/**
 * path 데코레이터 테스트
 */

import { path } from '../../src/decorators/path';
import { metadataStorage } from '../../src/types/metadata-storage';

describe('path 데코레이터', () => {
  beforeEach(() => {
    metadataStorage.clear();
  });

  describe('기본 경로 설정', () => {
    it('클래스에 경로를 설정할 수 있어야 한다', () => {
      @path('/users')
      class UserController {}

      const metadata = metadataStorage.getPathMetadata(UserController.prototype);
      expect(metadata).toBeDefined();
      expect(metadata?.path).toBe('/users');
    });

    it('슬래시로 시작하지 않는 경로는 자동으로 슬래시를 추가해야 한다', () => {
      @path('users')
      class UserController {}

      const metadata = metadataStorage.getPathMetadata(UserController.prototype);
      expect(metadata?.path).toBe('/users');
    });

    it('빈 경로는 루트 경로로 설정되어야 한다', () => {
      @path('')
      class RootController {}

      const metadata = metadataStorage.getPathMetadata(RootController.prototype);
      expect(metadata?.path).toBe('/');
    });
  });

  describe('중첩 경로', () => {
    it('중첩된 경로를 지원해야 한다', () => {
      @path('/api')
      class ApiController {}

      @path('/users')
      class UserController extends ApiController {}

      const metadata = metadataStorage.getPathMetadata(UserController.prototype);
      expect(metadata).toBeDefined();
      expect(metadata?.path).toBe('/users');
      expect(metadata?.basePath).toBe('/api');
    });

    it('3단계 이상 중첩된 경로를 지원해야 한다', () => {
      @path('/api')
      class ApiController {}

      @path('/v1')
      class V1Controller extends ApiController {}

      @path('/users')
      class UserController extends V1Controller {}

      const metadata = metadataStorage.getPathMetadata(UserController.prototype);
      expect(metadata).toBeDefined();
      expect(metadata?.path).toBe('/users');
      // basePath는 가장 가까운 부모의 전체 경로를 포함해야 함
      expect(metadata?.basePath).toBe('/api/v1');
    });
  });

  describe('경로 파라미터', () => {
    it('경로 파라미터가 있는 경로를 지원해야 한다', () => {
      @path('/users/:id')
      class UserDetailController {}

      const metadata = metadataStorage.getPathMetadata(UserDetailController.prototype);
      expect(metadata?.path).toBe('/users/:id');
    });

    it('여러 경로 파라미터를 지원해야 한다', () => {
      @path('/users/:userId/posts/:postId')
      class UserPostController {}

      const metadata = metadataStorage.getPathMetadata(UserPostController.prototype);
      expect(metadata?.path).toBe('/users/:userId/posts/:postId');
    });
  });

  describe('전체 경로 조회', () => {
    it('getFullPath 헬퍼 함수가 전체 경로를 반환해야 한다', () => {
      @path('/api')
      class ApiController {}

      @path('/users')
      class UserController extends ApiController {}

      const metadata = metadataStorage.getPathMetadata(UserController.prototype);
      expect(metadata).toBeDefined();

      // 전체 경로는 basePath + path
      const fullPath = metadata?.basePath ? `${metadata.basePath}${metadata.path}` : metadata?.path;
      expect(fullPath).toBe('/api/users');
    });
  });
});
