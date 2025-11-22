/**
 * Express.js 미들웨어 통합
 *
 * Express 앱에서 자동으로 OpenAPI 문서를 생성하는 미들웨어
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentBuilder } from '../builders/document-builder';
import { HttpMethod } from '../types/openapi.types';
import { stringify as yamlStringify } from 'yaml';

/**
 * Swagger 미들웨어 옵션
 */
export interface SwaggerMiddlewareOptions {
  /**
   * DocumentBuilder 인스턴스 (선택)
   * 제공하지 않으면 기본 빌더 생성
   */
  builder?: DocumentBuilder;

  /**
   * Swagger 문서를 제공할 경로
   * @default '/api-docs'
   */
  path?: string;

  /**
   * 경로를 자동으로 수집할지 여부
   * @default false
   */
  autoCollect?: boolean;

  /**
   * 제외할 경로 목록
   */
  excludePaths?: string[];

  /**
   * 문서 포맷
   * @default 'json'
   */
  format?: 'json' | 'yaml';

  /**
   * API 제목 (builder를 제공하지 않을 때 사용)
   * @default 'API Documentation'
   */
  title?: string;

  /**
   * API 버전 (builder를 제공하지 않을 때 사용)
   * @default '1.0.0'
   */
  version?: string;
}

/**
 * Express.js용 Swagger 미들웨어 생성
 *
 * @param options - 미들웨어 옵션
 * @returns Express 미들웨어 함수
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createSwaggerMiddleware } from 'jest-swagger/integrations/express';
 *
 * const app = express();
 *
 * // 기본 설정으로 사용
 * app.use(createSwaggerMiddleware());
 *
 * // 사용자 정의 설정
 * const builder = new DocumentBuilder('My API', '1.0.0')
 *   .setDescription('API 설명')
 *   .addServer('http://localhost:3000');
 *
 * app.use(createSwaggerMiddleware({
 *   builder,
 *   path: '/docs',
 *   autoCollect: true,
 *   excludePaths: ['/health', '/metrics']
 * }));
 * ```
 */
export function createSwaggerMiddleware(
  options: SwaggerMiddlewareOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    builder = new DocumentBuilder(options.title || 'API Documentation', options.version || '1.0.0'),
    path = '/api-docs',
    autoCollect = false,
    excludePaths = [],
    format = 'json',
  } = options;

  // 수집된 경로를 추적하는 Set
  const collectedPaths = new Set<string>();

  return (req: Request, res: Response, next: NextFunction) => {
    // Swagger 문서 경로 요청 처리
    if (req.path === path) {
      const document = builder.build();

      if (format === 'yaml') {
        res.set('Content-Type', 'text/yaml');
        res.status(200).send(yamlStringify(document));
      } else {
        res.status(200).json(document);
      }
      return;
    }

    // 자동 수집이 활성화된 경우 경로 등록
    if (autoCollect && !excludePaths.includes(req.path)) {
      const pathKey = `${req.method}:${req.path}`;

      // 아직 수집되지 않은 경로만 추가
      if (!collectedPaths.has(pathKey)) {
        collectedPaths.add(pathKey);

        const method = req.method.toLowerCase() as HttpMethod;

        // 기본 작업 정의 생성
        builder.addPath(req.path, method, {
          summary: `${req.method} ${req.path}`,
          responses: {
            '200': {
              description: '성공',
            },
          },
        });
      }
    }

    next();
  };
}

/**
 * Express 라우터에서 경로 정보 추출
 *
 * @param app - Express 앱 또는 라우터
 * @returns 경로 정보 배열
 */
export function extractRoutes(app: any): Array<{ path: string; method: string }> {
  const routes: Array<{ path: string; method: string }> = [];

  // Express 라우터 스택 탐색
  if (app._router?.stack) {
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        // 라우트 정보 추출
        const path = middleware.route.path;
        const methods = Object.keys(middleware.route.methods);

        methods.forEach((method) => {
          routes.push({
            path,
            method: method.toUpperCase(),
          });
        });
      }
    });
  }

  return routes;
}

/**
 * Express 앱의 모든 라우트를 DocumentBuilder에 추가
 *
 * @param app - Express 앱
 * @param builder - DocumentBuilder 인스턴스
 *
 * @example
 * ```typescript
 * const app = express();
 * const builder = new DocumentBuilder('API', '1.0.0');
 *
 * // 라우트 정의
 * app.get('/users', (req, res) => { ... });
 * app.post('/users', (req, res) => { ... });
 *
 * // 라우트를 문서에 추가
 * registerRoutes(app, builder);
 * ```
 */
export function registerRoutes(app: any, builder: DocumentBuilder): void {
  const routes = extractRoutes(app);

  routes.forEach(({ path, method }) => {
    builder.addPath(path, method.toLowerCase() as HttpMethod, {
      summary: `${method} ${path}`,
      responses: {
        '200': {
          description: '성공',
        },
      },
    });
  });
}
