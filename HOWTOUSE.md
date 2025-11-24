# jest-swagger 패키지 사용 방법

**English** | 한국어

Jest 테스트에서 Swagger/OpenAPI 문서를 자동 생성하는 TypeScript 라이브러리

---

## 목차

- [설치](#설치)
- [기본 개념](#기본-개념)
- [기본 사용법](#기본-사용법)
  - [1. 데코레이터 기반 문서화](#1-데코레이터-기반-문서화)
  - [2. 빌더 패턴 사용](#2-빌더-패턴-사용)
  - [3. Jest Reporter 설정](#3-jest-reporter-설정)
- [주요 기능](#주요-기능)
  - [API 데코레이터](#api-데코레이터)
  - [응답 캡처](#응답-캡처)
  - [스키마 자동 추론](#스키마-자동-추론)
  - [검증 기능](#검증-기능)
- [프레임워크 통합](#프레임워크-통합)
  - [Express.js](#expressjs)
  - [NestJS](#nestjs)
  - [Fastify](#fastify)
- [고급 기능](#고급-기능)
  - [타입 생성](#타입-생성)
  - [스키마 변환](#스키마-변환)
- [설정 옵션](#설정-옵션)
- [문제 해결](#문제-해결)

---

## 설치

```bash
npm install --save-dev jest-swagger
```

또는 yarn 사용:

```bash
yarn add -D jest-swagger
```

### 필수 요구사항

- Node.js >= 16.0.0
- TypeScript >= 5.0.0
- Jest >= 29.0.0

### TypeScript 설정

`tsconfig.json`에 다음 설정을 추가해야 합니다:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Jest 설정

`jest.config.ts` 또는 `jest.config.js`에 다음 설정을 추가합니다:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
};

export default config;
```

---

## 기본 개념

`jest-swagger`는 세 가지 핵심 컴포넌트로 구성됩니다:

1. **데코레이터**: Jest 테스트에 API 메타데이터를 추가하는 TypeScript 데코레이터
2. **빌더**: 프로그래매틱하게 OpenAPI 문서를 생성하는 빌더 클래스
3. **리포터**: Jest 테스트 실행 중 자동으로 문서를 수집하고 생성하는 리포터

---

## 기본 사용법

### 1. 데코레이터 기반 문서화

Jest 테스트에 데코레이터를 적용하여 API 문서를 작성합니다.

#### 기본 예제

```typescript
import { api, path, response } from 'jest-swagger';

describe('사용자 API', () => {
  @api({
    tags: ['users'],
    summary: '사용자 조회',
    description: 'ID로 특정 사용자를 조회합니다.'
  })
  @path('get', '/users/{id}')
  @response(200, {
    description: '성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  })
  test('ID로 사용자를 조회할 수 있어야 함', async () => {
    // 테스트 코드
  });
});
```

#### 파라미터 정의

```typescript
import { api, path, query, pathParam, body, response } from 'jest-swagger';

describe('사용자 API', () => {
  @api({
    tags: ['users'],
    summary: '사용자 목록 조회'
  })
  @path('get', '/users')
  @query({
    name: 'page',
    description: '페이지 번호',
    schema: { type: 'number', minimum: 1, default: 1 }
  })
  @query({
    name: 'limit',
    description: '페이지 당 항목 수',
    schema: { type: 'number', minimum: 1, maximum: 100, default: 10 }
  })
  @response(200, {
    description: '성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            total: { type: 'number' },
            page: { type: 'number' }
          }
        }
      }
    }
  })
  test('페이지네이션된 사용자 목록을 조회할 수 있어야 함', async () => {
    // 테스트 코드
  });
});
```

#### POST/PUT 요청 예제

```typescript
import { api, path, body, response } from 'jest-swagger';

describe('사용자 API', () => {
  @api({
    tags: ['users'],
    summary: '사용자 생성'
  })
  @path('post', '/users')
  @body({
    description: '사용자 생성 정보',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 50 },
            email: { type: 'string', format: 'email' }
          }
        }
      }
    }
  })
  @response(201, {
    description: '사용자가 성공적으로 생성됨'
  })
  @response(400, {
    description: '잘못된 요청'
  })
  test('새로운 사용자를 생성할 수 있어야 함', async () => {
    // 테스트 코드
  });
});
```

### 2. 빌더 패턴 사용

프로그래매틱하게 OpenAPI 문서를 생성할 수 있습니다.

```typescript
import { DocumentBuilder } from 'jest-swagger';

const document = new DocumentBuilder('My API', '1.0.0')
  .setDescription('API 설명')
  .addServer('http://localhost:3000', '개발 서버')
  .addServer('https://api.example.com', '프로덕션 서버')
  .addTag('users', '사용자 관리 API')
  .addTag('posts', '게시물 관리 API')
  .addPath('/users', {
    get: {
      tags: ['users'],
      summary: '사용자 목록 조회',
      responses: {
        '200': {
          description: '성공',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  .build();
```

### 3. Jest Reporter 설정

Jest 설정 파일에 `SwaggerReporter`를 추가하여 테스트 실행 시 자동으로 문서를 생성합니다.

#### package.json 설정

```json
{
  "jest": {
    "reporters": [
      "default",
      [
        "jest-swagger/dist/reporters",
        {
          "outputDir": "./docs",
          "filename": "openapi",
          "format": "yaml",
          "printPath": true,
          "printStats": true
        }
      ]
    ]
  }
}
```

#### jest.config.ts 설정

```typescript
import type { Config } from 'jest';

const config: Config = {
  // ... 기타 설정
  reporters: [
    'default',
    [
      'jest-swagger/dist/reporters',
      {
        outputDir: './docs',
        filename: 'openapi',
        format: 'yaml',
        multiFormat: true, // JSON과 YAML 모두 생성
        printPath: true,
        printStats: true,
        validate: true,
      },
    ],
  ],
};

export default config;
```

---

## 주요 기능

### API 데코레이터

#### @api()

API 엔드포인트의 기본 정보를 정의합니다.

```typescript
@api({
  tags: ['users'],                    // 태그 (그룹화)
  summary: '사용자 조회',              // 간단한 설명
  description: '상세 설명',           // 상세 설명
  operationId: 'getUser',             // 고유 식별자 (선택)
  deprecated: false                   // 사용 중단 여부 (선택)
})
```

#### @path()

HTTP 메서드와 경로를 정의합니다.

```typescript
@path('get', '/users/{id}')      // GET /users/{id}
@path('post', '/users')          // POST /users
@path('put', '/users/{id}')      // PUT /users/{id}
@path('delete', '/users/{id}')   // DELETE /users/{id}
@path('patch', '/users/{id}')    // PATCH /users/{id}
```

#### @response()

응답 정보를 정의합니다.

```typescript
@response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' }
        }
      },
      example: {
        id: 1,
        name: '홍길동'
      }
    }
  }
})
```

#### 파라미터 데코레이터

```typescript
// 쿼리 파라미터
@query({
  name: 'page',
  description: '페이지 번호',
  required: false,
  schema: { type: 'number', default: 1 }
})

// 경로 파라미터
@pathParam({
  name: 'id',
  description: '사용자 ID',
  required: true,
  schema: { type: 'number' }
})

// 헤더 파라미터
@header({
  name: 'Authorization',
  description: '인증 토큰',
  required: true,
  schema: { type: 'string' }
})

// 쿠키 파라미터
@cookie({
  name: 'session',
  description: '세션 ID',
  schema: { type: 'string' }
})

// 요청 본문
@body({
  description: '요청 본문',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }
})
```

### 응답 캡처

실제 HTTP 응답을 자동으로 캡처하여 문서에 포함시킬 수 있습니다.

```typescript
import { CaptureResponse } from 'jest-swagger';

describe('사용자 API', () => {
  @api({ tags: ['users'], summary: '사용자 조회' })
  @path('get', '/users/{id}')
  @CaptureResponse({
    statusCode: 200,
    autoInferSchema: true,    // 스키마 자동 추론
    validateSchema: false     // 스키마 검증 여부
  })
  test('사용자 조회', async () => {
    const response = await fetch('/api/users/1');
    const data = await response.json();

    // 응답이 자동으로 캡처되어 OpenAPI 문서에 포함됨
    expect(response.status).toBe(200);
  });
});
```

### 스키마 자동 추론

JavaScript 객체로부터 자동으로 OpenAPI 스키마를 생성합니다.

```typescript
import { inferSchema } from 'jest-swagger';

const user = {
  id: 1,
  name: '홍길동',
  email: 'hong@example.com',
  age: 30,
  active: true,
  tags: ['developer', 'typescript'],
  address: {
    city: 'Seoul',
    zipCode: '12345',
  },
};

const schema = inferSchema(user);
// {
//   type: 'object',
//   properties: {
//     id: { type: 'number' },
//     name: { type: 'string' },
//     email: { type: 'string' },
//     age: { type: 'number' },
//     active: { type: 'boolean' },
//     tags: { type: 'array', items: { type: 'string' } },
//     address: {
//       type: 'object',
//       properties: {
//         city: { type: 'string' },
//         zipCode: { type: 'string' }
//       }
//     }
//   }
// }
```

### 검증 기능

#### Zod 스키마 변환

```typescript
import { z } from 'zod';
import { convertZodToOpenAPI } from 'jest-swagger';

const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(0).max(120).optional(),
  role: z.enum(['admin', 'user', 'guest']),
});

const openAPISchema = convertZodToOpenAPI(UserSchema);
// OpenAPI 3.0 스키마로 자동 변환됨
```

#### Joi 스키마 변환

```typescript
import Joi from 'joi';
import { convertJoiToOpenAPI } from 'jest-swagger';

const userSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(0).max(120),
  role: Joi.string().valid('admin', 'user', 'guest'),
});

const openAPISchema = convertJoiToOpenAPI(userSchema);
// OpenAPI 3.0 스키마로 자동 변환됨
```

---

## 프레임워크 통합

### Express.js

Express 앱에서 자동으로 라우트를 수집하고 문서화합니다.

```typescript
import express from 'express';
import { createSwaggerMiddleware, DocumentBuilder } from 'jest-swagger';

const app = express();

// Swagger 문서 빌더 생성
const builder = new DocumentBuilder('Express API', '1.0.0')
  .setDescription('Express.js API 문서')
  .addServer('http://localhost:3000', '로컬 서버');

// Swagger 미들웨어 등록
app.use(
  createSwaggerMiddleware({
    builder,
    path: '/api-docs', // 문서 경로
    autoCollect: true, // 자동 라우트 수집
    excludePaths: ['/health'], // 제외할 경로
    format: 'json', // 출력 포맷
  })
);

// API 라우트
app.get('/users', (req, res) => {
  res.json([{ id: 1, name: 'John' }]);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Swagger docs at http://localhost:3000/api-docs');
});
```

### NestJS

NestJS 컨트롤러에서 데코레이터를 사용합니다.

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { api, path, response, pathParam, body } from 'jest-swagger';

@Controller('users')
export class UsersController {
  @Get(':id')
  @api({ tags: ['users'], summary: '사용자 조회' })
  @path('get', '/users/{id}')
  @pathParam({ name: 'id', schema: { type: 'number' } })
  @response(200, {
    description: '성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
        },
      },
    },
  })
  getUser(@Param('id') id: string) {
    return { id: Number(id), name: 'John Doe' };
  }
}
```

### Fastify

Fastify 앱에서 플러그인으로 사용합니다.

```typescript
import Fastify from 'fastify';
import { createFastifyPlugin, DocumentBuilder } from 'jest-swagger';

const fastify = Fastify();

// Swagger 플러그인 등록
const builder = new DocumentBuilder('Fastify API', '1.0.0').setDescription('Fastify API 문서');

fastify.register(createFastifyPlugin, {
  builder,
  routePrefix: '/api-docs',
  autoCollect: true,
});

// API 라우트
fastify.get('/users', async (request, reply) => {
  return [{ id: 1, name: 'John' }];
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Server running on http://localhost:3000');
});
```

---

## 고급 기능

### 타입 생성

OpenAPI 문서로부터 TypeScript 타입을 자동 생성합니다.

```typescript
import { generateTypesFromDocument } from 'jest-swagger';

const document = {
  // OpenAPI 문서
};

const types = generateTypesFromDocument(document, {
  outputDir: './src/types',
  filename: 'api.types.ts',
  exportType: 'named', // 'named' | 'default'
});

// 생성된 타입 파일:
// export interface User {
//   id: number;
//   name: string;
//   email: string;
// }
```

### 스키마 병합

여러 스키마를 병합하여 하나의 문서로 만듭니다.

```typescript
import { DocumentBuilder } from 'jest-swagger';

const builder = new DocumentBuilder('Combined API', '1.0.0');

// 첫 번째 스키마 추가
builder.addSchema('User', {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
  },
});

// 두 번째 스키마 추가 (병합)
builder.addSchema(
  'User',
  {
    type: 'object',
    properties: {
      email: { type: 'string' },
    },
  },
  { merge: true }
);

// 결과:
// User 스키마에 id, name, email 모두 포함됨
```

### 컴포넌트 레지스트리

재사용 가능한 스키마를 글로벌하게 관리합니다.

```typescript
import { globalComponentRegistry } from 'jest-swagger';

// 스키마 등록
globalComponentRegistry.register('User', 'schemas', {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
  },
});

// 스키마 조회
const userSchema = globalComponentRegistry.get('User', 'schemas');

// 모든 스키마 조회
const allSchemas = globalComponentRegistry.getAll('schemas');

// 스키마 삭제
globalComponentRegistry.remove('User', 'schemas');
```

---

## 설정 옵션

### SwaggerReporter 옵션

```typescript
interface ReporterOptions {
  // 출력 설정
  outputDir?: string; // 출력 디렉토리 (기본값: './docs')
  filename?: string; // 파일 이름 (기본값: 'openapi')
  format?: 'json' | 'yaml'; // 출력 포맷 (기본값: 'yaml')
  multiFormat?: boolean; // JSON과 YAML 모두 생성 (기본값: false)
  overwrite?: boolean; // 기존 파일 덮어쓰기 (기본값: true)

  // 포맷 설정
  pretty?: boolean; // 보기 좋게 포맷팅 (기본값: true)
  indent?: number; // 들여쓰기 공백 수 (기본값: 2)

  // 로그 설정
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  printPath?: boolean; // 생성된 파일 경로 출력 (기본값: true)
  printStats?: boolean; // 문서 통계 출력 (기본값: false)

  // 검증 설정
  validate?: boolean; // 문서 검증 (기본값: true)
  strictValidation?: boolean; // 엄격한 검증 (기본값: false)

  // 수집 설정
  collectMetadata?: boolean; // 메타데이터 수집 (기본값: true)
  merge?: boolean; // 기존 문서와 병합 (기본값: false)
  onlyAfterAllTests?: boolean; // 모든 테스트 후 생성 (기본값: true)
  includeFailedTests?: boolean; // 실패한 테스트 포함 (기본값: false)
  includeSkippedTests?: boolean; // 스킵된 테스트 포함 (기본값: false)
  includeTestMetadata?: boolean; // 테스트 메타데이터 포함 (기본값: false)

  // 콜백
  onComplete?: (result: ReporterResult) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}
```

### DocumentBuilder 메서드

```typescript
const builder = new DocumentBuilder(title, version)
  .setDescription(description) // 설명 설정
  .addServer(url, description) // 서버 추가
  .addTag(name, description) // 태그 추가
  .addPath(path, operations) // 경로 추가
  .addSchema(name, schema, options) // 스키마 추가
  .setSecurityScheme(name, scheme) // 보안 스키마 설정
  .addSecurityRequirement(requirements) // 보안 요구사항 추가
  .build(); // 문서 생성
```

---

## 문제 해결

### 데코레이터가 작동하지 않음

**원인**: TypeScript 설정에서 데코레이터가 활성화되지 않았을 수 있습니다.

**해결**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Jest에서 데코레이터 에러 발생

**원인**: Jest의 TypeScript 변환 설정이 잘못되었을 수 있습니다.

**해결**:

```typescript
// jest.config.ts
const config: Config = {
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
};
```

### 문서가 생성되지 않음

**원인**: Reporter가 올바르게 설정되지 않았을 수 있습니다.

**해결**:

1. Jest 설정 확인:

```typescript
reporters: [
  'default',
  [
    'jest-swagger/dist/reporters',
    {
      /* 옵션 */
    },
  ],
];
```

2. 테스트 실행:

```bash
npm test
```

3. 로그 레벨 증가:

```typescript
reporters: [
  'default',
  [
    'jest-swagger/dist/reporters',
    {
      logLevel: 'debug',
      printPath: true,
      printStats: true,
    },
  ],
];
```

### 스키마 추론이 정확하지 않음

**원인**: 복잡한 객체나 특수한 타입의 경우 자동 추론이 정확하지 않을 수 있습니다.

**해결**: 명시적으로 스키마를 정의하거나 Zod/Joi 스키마를 사용합니다.

```typescript
// 명시적 스키마 정의
@response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          // 명시적으로 정의
        }
      }
    }
  }
})

// 또는 Zod 사용
import { z } from 'zod';
import { convertZodToOpenAPI } from 'jest-swagger';

const schema = z.object({
  id: z.number(),
  name: z.string()
});

const openAPISchema = convertZodToOpenAPI(schema);
```

### 빌드 시 타입 에러

**원인**: 타입 정의 파일이 제대로 import되지 않았을 수 있습니다.

**해결**:

```typescript
// 명시적 타입 import
import type { ApiOptions, ResponseOptions } from 'jest-swagger';
```

---

## 추가 리소스

- [GitHub Repository](https://github.com/yourusername/jest-swagger)
- [API Reference](https://github.com/yourusername/jest-swagger/wiki/API-Reference)
- [Examples](https://github.com/yourusername/jest-swagger/tree/main/examples)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)

---

## 라이선스

MIT License

## 기여하기

기여를 환영합니다! 자세한 내용은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참조하세요.
