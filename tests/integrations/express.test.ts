/**
 * Express.js 미들웨어 테스트
 */

import { Request, Response, NextFunction } from 'express';
import { createSwaggerMiddleware, SwaggerMiddlewareOptions } from '../../src/integrations/express';
import { DocumentBuilder } from '../../src/builders/document-builder';

describe('Express Swagger 미들웨어', () => {
  describe('createSwaggerMiddleware', () => {
    it('기본 설정으로 미들웨어를 생성할 수 있어야 함', () => {
      const middleware = createSwaggerMiddleware();

      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    it('사용자 정의 DocumentBuilder를 사용할 수 있어야 함', () => {
      const builder = new DocumentBuilder('Test API', '1.0.0')
        .setDescription('테스트 API')
        .addServer('http://localhost:3000');

      const middleware = createSwaggerMiddleware({ builder });

      expect(middleware).toBeDefined();
    });

    it('사용자 정의 경로를 설정할 수 있어야 함', () => {
      const options: SwaggerMiddlewareOptions = {
        path: '/custom-docs',
      };

      const middleware = createSwaggerMiddleware(options);

      expect(middleware).toBeDefined();
    });

    it('미들웨어가 요청을 처리하고 다음 미들웨어로 전달해야 함', () => {
      const middleware = createSwaggerMiddleware();
      const req = { path: '/api/users' } as Request;
      const res = {} as Response;
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('Swagger 문서 경로에 접근 시 문서를 반환해야 함', () => {
      const middleware = createSwaggerMiddleware({ path: '/api-docs' });
      const req = { path: '/api-docs' } as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('경로 메타데이터를 자동으로 수집해야 함', () => {
      const builder = new DocumentBuilder('API', '1.0.0');
      const middleware = createSwaggerMiddleware({
        builder,
        autoCollect: true,
      });

      const req = {
        path: '/api/users/:id',
        method: 'GET',
      } as Request;
      const res = {} as Response;
      const next = jest.fn();

      middleware(req, res, next);

      const doc = builder.build();
      expect(doc.paths).toBeDefined();
    });

    it('특정 경로를 제외할 수 있어야 함', () => {
      const middleware = createSwaggerMiddleware({
        excludePaths: ['/health', '/metrics'],
      });

      const req = { path: '/health' } as Request;
      const res = {} as Response;
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('YAML 형식으로 문서를 반환할 수 있어야 함', () => {
      const middleware = createSwaggerMiddleware({
        path: '/api-docs',
        format: 'yaml',
      });

      const req = { path: '/api-docs' } as Request;
      const res = {
        send: jest.fn(),
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/yaml');
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('경로 자동 탐지', () => {
    it('GET 요청 경로를 자동으로 등록해야 함', () => {
      const builder = new DocumentBuilder('API', '1.0.0');
      const middleware = createSwaggerMiddleware({
        builder,
        autoCollect: true,
      });

      const req = {
        path: '/api/users',
        method: 'GET',
      } as Request;
      const res = {} as Response;
      const next = jest.fn();

      middleware(req, res, next);

      const doc = builder.build();
      expect(doc.paths['/api/users']).toBeDefined();
      expect(doc.paths['/api/users']?.get).toBeDefined();
    });

    it('POST 요청 경로를 자동으로 등록해야 함', () => {
      const builder = new DocumentBuilder('API', '1.0.0');
      const middleware = createSwaggerMiddleware({
        builder,
        autoCollect: true,
      });

      const req = {
        path: '/api/users',
        method: 'POST',
      } as Request;
      const res = {} as Response;
      const next = jest.fn();

      middleware(req, res, next);

      const doc = builder.build();
      expect(doc.paths['/api/users']).toBeDefined();
      expect(doc.paths['/api/users']?.post).toBeDefined();
    });
  });
});
