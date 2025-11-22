# jest-swagger API 문서

## 목차

1. [데코레이터](#데코레이터)
2. [빌더](#빌더)
3. [리포터](#리포터)
4. [타입 생성기](#타입-생성기)
5. [통합](#통합)

---

## 데코레이터

### @Api

클래스나 함수에 API 정보를 추가합니다.

**시그니처:**
```typescript
@Api(options: ApiDecoratorOptions)
```

**옵션:**
```typescript
interface ApiDecoratorOptions {
  tags?: string[];        // API 태그
  summary?: string;       // 요약 설명
  description?: string;   // 상세 설명
  deprecated?: boolean;   // 더 이상 사용되지 않음 표시
}
```

**예제:**
```typescript
import { Api } from 'jest-swagger';

@Api({
  tags: ['users'],
  summary: '사용자 생성',
  description: '새로운 사용자를 생성합니다.',
})
test('POST /users - 사용자 생성', async () => {
  // 테스트 코드
});
```

---

### @Path

HTTP 경로와 메서드를 지정합니다.

**시그니처:**
```typescript
@Path(method: HttpMethod, path: string)
```

**HTTP 메서드:**
- `'get'`
- `'post'`
- `'put'`
- `'delete'`
- `'patch'`
- `'options'`
- `'head'`

**예제:**
```typescript
import { Path } from 'jest-swagger';

@Path('post', '/users')
test('사용자 생성', async () => {
  // 테스트 코드
});

@Path('get', '/users/{id}')
test('사용자 조회', async () => {
  // 테스트 코드
});
```

---

### @Parameter

API 파라미터를 정의합니다.

**시그니처:**
```typescript
@Parameter(options: ParameterDecoratorOptions)
```

**옵션:**
```typescript
interface ParameterDecoratorOptions {
  name: string;                           // 파라미터 이름
  in: 'query' | 'header' | 'path' | 'cookie';  // 위치
  description?: string;                   // 설명
  required?: boolean;                     // 필수 여부
  schema?: SchemaObject;                  // 스키마 정의
  example?: unknown;                      // 예제 값
}
```

**예제:**
```typescript
import { Parameter } from 'jest-swagger';

@Parameter({
  name: 'id',
  in: 'path',
  description: '사용자 ID',
  required: true,
  schema: { type: 'number' },
  example: 123,
})
@Parameter({
  name: 'limit',
  in: 'query',
  description: '조회할 개수',
  schema: { type: 'number', minimum: 1, maximum: 100 },
  example: 10,
})
test('GET /users/{id} - 사용자 조회', async () => {
  // 테스트 코드
});
```

---

### @Response

API 응답을 정의합니다.

**시그니처:**
```typescript
@Response(statusCode: number, options: ResponseDecoratorOptions)
```

**옵션:**
```typescript
interface ResponseDecoratorOptions {
  description: string;                    // 응답 설명
  content?: {                             // 응답 내용
    [mediaType: string]: {
      schema: SchemaObject;
      example?: unknown;
    };
  };
}
```

**예제:**
```typescript
import { Response } from 'jest-swagger';

@Response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
      example: {
        id: 1,
        name: '홍길동',
        email: 'hong@example.com',
      },
    },
  },
})
@Response(404, {
  description: '사용자를 찾을 수 없음',
})
test('GET /users/{id} - 사용자 조회', async () => {
  // 테스트 코드
});
```

---

## 빌더

### DocumentBuilder

OpenAPI 문서를 생성합니다.

**메서드:**

#### `setTitle(title: string): this`
API 문서 제목을 설정합니다.

#### `setVersion(version: string): this`
API 버전을 설정합니다.

#### `setDescription(description: string): this`
API 설명을 설정합니다.

#### `addServer(url: string, description?: string): this`
서버 정보를 추가합니다.

#### `addTag(name: string, description?: string): this`
태그를 추가합니다.

#### `build(): OpenAPIDocument`
OpenAPI 문서를 생성합니다.

**예제:**
```typescript
import { DocumentBuilder } from 'jest-swagger';

const document = new DocumentBuilder()
  .setTitle('사용자 관리 API')
  .setVersion('1.0.0')
  .setDescription('사용자 생성, 조회, 수정, 삭제 API')
  .addServer('http://localhost:3000', '개발 서버')
  .addServer('https://api.example.com', '프로덕션 서버')
  .addTag('users', '사용자 관리')
  .addTag('auth', '인증')
  .build();
```

---

### SchemaInference

런타임 값에서 OpenAPI 스키마를 추론합니다.

**메서드:**

#### `inferSchema(value: unknown): SchemaObject`
값에서 스키마를 추론합니다.

**예제:**
```typescript
import { SchemaInference } from 'jest-swagger';

const inference = new SchemaInference();

// 객체에서 스키마 추론
const userSchema = inference.inferSchema({
  id: 1,
  name: '홍길동',
  email: 'hong@example.com',
  isActive: true,
});

// 결과:
// {
//   type: 'object',
//   properties: {
//     id: { type: 'number' },
//     name: { type: 'string' },
//     email: { type: 'string' },
//     isActive: { type: 'boolean' }
//   }
// }
```

---

## 리포터

### SwaggerReporter

Jest 리포터로 테스트 실행 시 OpenAPI 문서를 자동 생성합니다.

**설정:**

`jest.config.ts`:
```typescript
export default {
  reporters: [
    'default',
    [
      'jest-swagger/reporters',
      {
        outputPath: './swagger.yaml',
        format: 'yaml', // 'yaml' | 'json'
        title: 'API 문서',
        version: '1.0.0',
      },
    ],
  ],
};
```

---

## 타입 생성기

### TypeGenerator

OpenAPI 문서에서 TypeScript 타입을 자동 생성합니다.

**메서드:**

#### `generateType(schema: SchemaObject, typeName: string): string`
스키마에서 타입을 생성합니다.

#### `generateFromDocument(document: OpenAPIDocument): string`
OpenAPI 문서 전체에서 타입을 생성합니다.

#### `generateToFile(document: OpenAPIDocument, outputPath: string): Promise<void>`
타입 정의를 파일로 저장합니다.

**예제:**

```typescript
import { TypeGenerator } from 'jest-swagger';
import * as fs from 'fs';

const generator = new TypeGenerator();

// OpenAPI 문서 로드
const document = JSON.parse(fs.readFileSync('./swagger.json', 'utf-8'));

// TypeScript 타입 생성
await generator.generateToFile(document, './types/api.ts');
```

**생성된 타입 예제:**

```typescript
/**
 * Generated types from 사용자 관리 API
 * Version: 1.0.0
 * @generated This file is auto-generated. Do not edit manually.
 */

/**
 * 사용자 정보
 */
export interface User {
  /** 사용자 ID */
  id: number;
  /** 사용자 이름 */
  name: string;
  /** 이메일 */
  email?: string;
  /** 활성 상태 */
  isActive?: boolean;
}

/**
 * 사용자 역할
 */
export type UserRole = 'admin' | 'user' | 'guest';
```

**검증 규칙 주석:**

```typescript
/**
 * 사용자 이름
 * @minLength 3
 * @maxLength 50
 * @pattern ^[a-zA-Z가-힣]+$
 */
export type UserName = string;

/**
 * 나이
 * @minimum 0
 * @maximum 150
 */
export type Age = number;
```

---

## 통합

### Express 통합

Express 앱과 통합하여 Swagger UI를 제공합니다.

```typescript
import express from 'express';
import { setupSwagger } from 'jest-swagger/integrations';

const app = express();

setupSwagger(app, {
  swaggerPath: './swagger.yaml',
  uiPath: '/api-docs',
  title: 'API 문서',
});

app.listen(3000, () => {
  console.log('서버가 시작되었습니다.');
  console.log('Swagger UI: http://localhost:3000/api-docs');
});
```

### Fastify 통합

```typescript
import Fastify from 'fastify';
import { setupSwaggerForFastify } from 'jest-swagger/integrations';

const fastify = Fastify();

await setupSwaggerForFastify(fastify, {
  swaggerPath: './swagger.yaml',
  uiPath: '/api-docs',
  title: 'API 문서',
});

await fastify.listen({ port: 3000 });
```

---

## 타입 정의

### SchemaObject

OpenAPI 스키마를 나타내는 타입입니다.

```typescript
interface SchemaObject {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  enum?: unknown[];
  example?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  $ref?: string;

  // 숫자 검증
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  // 문자열 검증
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // 배열 검증
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // 객체 검증
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | SchemaObject;
}
```

---

## 예제 프로젝트

완전한 예제는 [examples](../examples) 디렉토리를 참조하세요.

- [기본 사용법](../examples/basic-usage)
- [Express 통합](../examples/express-integration)
- [타입 생성](../examples/type-generation)
- [복잡한 API](../examples/complex-api)
