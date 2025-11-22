# jest-swagger 튜토리얼

이 튜토리얼에서는 jest-swagger를 사용하여 Jest 테스트에서 OpenAPI 문서를 자동 생성하는 방법을 단계별로 안내합니다.

## 목차

1. [설치](#1-설치)
2. [기본 설정](#2-기본-설정)
3. [첫 번째 API 테스트 작성](#3-첫-번째-api-테스트-작성)
4. [파라미터 정의](#4-파라미터-정의)
5. [응답 정의](#5-응답-정의)
6. [타입 생성](#6-타입-생성)
7. [고급 기능](#7-고급-기능)

---

## 1. 설치

npm을 사용하여 jest-swagger를 설치합니다.

```bash
npm install --save-dev jest-swagger
```

또는 yarn을 사용합니다.

```bash
yarn add --dev jest-swagger
```

---

## 2. 기본 설정

### Jest 설정

`jest.config.ts` 파일을 생성하고 SwaggerReporter를 추가합니다.

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-swagger/reporters',
      {
        outputPath: './docs/swagger.yaml',
        format: 'yaml',
        title: '사용자 관리 API',
        version: '1.0.0',
        description: '사용자 생성, 조회, 수정, 삭제 API',
      },
    ],
  ],
};

export default config;
```

### TypeScript 설정

`tsconfig.json`에 데코레이터 지원을 활성화합니다.

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## 3. 첫 번째 API 테스트 작성

간단한 사용자 생성 API 테스트를 작성해 봅시다.

### 테스트 파일: `tests/users.test.ts`

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('사용자 관리 API', () => {
  @Api({
    tags: ['users'],
    summary: '사용자 생성',
    description: '새로운 사용자를 생성합니다.',
  })
  @Path('post', '/users')
  @Response(201, {
    description: '사용자가 성공적으로 생성됨',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: '사용자 ID' },
            name: { type: 'string', description: '사용자 이름' },
            email: { type: 'string', description: '이메일 주소' },
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
  test('POST /users - 사용자 생성', async () => {
    // 실제 API 호출 또는 모의 테스트
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '홍길동',
        email: 'hong@example.com',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name', '홍길동');
    expect(data).toHaveProperty('email', 'hong@example.com');
  });
});
```

### 테스트 실행

```bash
npm test
```

테스트가 실행되면 `docs/swagger.yaml` 파일이 자동으로 생성됩니다.

---

## 4. 파라미터 정의

이제 파라미터가 있는 API 테스트를 작성해 봅시다.

### 경로 파라미터

```typescript
import { Api, Path, Parameter, Response } from 'jest-swagger';

@Api({
  tags: ['users'],
  summary: '사용자 조회',
  description: 'ID로 특정 사용자를 조회합니다.',
})
@Path('get', '/users/{id}')
@Parameter({
  name: 'id',
  in: 'path',
  description: '사용자 ID',
  required: true,
  schema: { type: 'number' },
  example: 1,
})
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
    },
  },
})
@Response(404, {
  description: '사용자를 찾을 수 없음',
})
test('GET /users/{id} - 사용자 조회', async () => {
  const response = await fetch('http://localhost:3000/users/1');
  expect(response.status).toBe(200);
});
```

### 쿼리 파라미터

```typescript
@Api({
  tags: ['users'],
  summary: '사용자 목록 조회',
  description: '페이지네이션된 사용자 목록을 조회합니다.',
})
@Path('get', '/users')
@Parameter({
  name: 'page',
  in: 'query',
  description: '페이지 번호',
  schema: { type: 'number', minimum: 1 },
  example: 1,
})
@Parameter({
  name: 'limit',
  in: 'query',
  description: '페이지 당 항목 수',
  schema: { type: 'number', minimum: 1, maximum: 100 },
  example: 10,
})
@Response(200, {
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
            email: { type: 'string' },
          },
        },
      },
    },
  },
})
test('GET /users - 사용자 목록 조회', async () => {
  const response = await fetch('http://localhost:3000/users?page=1&limit=10');
  expect(response.status).toBe(200);
});
```

### 헤더 파라미터

```typescript
@Api({
  tags: ['users'],
  summary: '인증된 사용자 정보 조회',
})
@Path('get', '/me')
@Parameter({
  name: 'Authorization',
  in: 'header',
  description: '인증 토큰',
  required: true,
  schema: { type: 'string' },
  example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
})
@Response(200, {
  description: '성공',
})
@Response(401, {
  description: '인증 실패',
})
test('GET /me - 내 정보 조회', async () => {
  const response = await fetch('http://localhost:3000/me', {
    headers: {
      Authorization: 'Bearer token123',
    },
  });
  expect(response.status).toBe(200);
});
```

---

## 5. 응답 정의

다양한 응답 시나리오를 정의해 봅시다.

### 성공 응답

```typescript
@Response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
            },
          },
        },
      },
      example: {
        success: true,
        data: {
          id: 1,
          name: '홍길동',
        },
      },
    },
  },
})
```

### 에러 응답

```typescript
@Response(400, {
  description: '잘못된 요청',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      example: {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: '이메일 형식이 올바르지 않습니다.',
        },
      },
    },
  },
})
```

---

## 6. 타입 생성

OpenAPI 문서에서 TypeScript 타입을 자동 생성할 수 있습니다.

### 타입 생성 스크립트

`scripts/generate-types.ts` 파일을 생성합니다.

```typescript
import { TypeGenerator } from 'jest-swagger';
import * as fs from 'fs';
import * as YAML from 'yaml';

async function generateTypes() {
  // OpenAPI 문서 로드
  const swaggerContent = fs.readFileSync('./docs/swagger.yaml', 'utf-8');
  const document = YAML.parse(swaggerContent);

  // TypeScript 타입 생성
  const generator = new TypeGenerator();
  await generator.generateToFile(document, './src/types/api.generated.ts');

  console.log('✅ 타입이 성공적으로 생성되었습니다.');
}

generateTypes().catch(console.error);
```

### package.json 스크립트 추가

```json
{
  "scripts": {
    "generate-types": "ts-node scripts/generate-types.ts"
  }
}
```

### 타입 생성 실행

```bash
npm run generate-types
```

### 생성된 타입 사용

```typescript
import type { User, UserRole } from './types/api.generated';

function createUser(data: User): void {
  console.log('사용자 생성:', data);
}

const role: UserRole = 'admin';
```

---

## 7. 고급 기능

### 중첩된 객체 스키마

```typescript
@Response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              profile: {
                type: 'object',
                properties: {
                  bio: { type: 'string' },
                  avatar: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
})
```

### 배열 응답

```typescript
@Response(200, {
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
})
```

### Enum 타입

```typescript
@Response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['admin', 'user', 'guest'],
            description: '사용자 역할',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
            description: '사용자 상태',
          },
        },
      },
    },
  },
})
```

### 검증 규칙

```typescript
@Response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            pattern: '^[a-zA-Z가-힣]+$',
            description: '사용자 이름',
          },
          age: {
            type: 'number',
            minimum: 0,
            maximum: 150,
            description: '나이',
          },
          email: {
            type: 'string',
            format: 'email',
            description: '이메일',
          },
        },
      },
    },
  },
})
```

### $ref 참조 사용

문서 빌더를 사용하여 재사용 가능한 스키마를 정의할 수 있습니다.

```typescript
import { DocumentBuilder } from 'jest-swagger';

const document = new DocumentBuilder()
  .setTitle('사용자 관리 API')
  .setVersion('1.0.0')
  .addSchema('User', {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'number' },
      name: { type: 'string' },
      email: { type: 'string' },
    },
  })
  .build();
```

그런 다음 응답에서 참조할 수 있습니다:

```typescript
@Response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/User',
      },
    },
  },
})
```

---

## 다음 단계

- [API 문서](./API.md)에서 모든 데코레이터와 옵션을 확인하세요.
- [예제 프로젝트](../examples)에서 실제 사용 사례를 살펴보세요.
- [마이그레이션 가이드](./MIGRATION.md)에서 다른 도구에서 마이그레이션하는 방법을 확인하세요.
