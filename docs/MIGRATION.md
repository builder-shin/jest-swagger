# 마이그레이션 가이드

다른 도구에서 jest-swagger로 마이그레이션하는 방법을 안내합니다.

## 목차

1. [Supertest + Swagger-JSDoc에서 마이그레이션](#1-supertest--swagger-jsdoc에서-마이그레이션)
2. [NestJS Swagger에서 마이그레이션](#2-nestjs-swagger에서-마이그레이션)
3. [Swagger-Autogen에서 마이그레이션](#3-swagger-autogen에서-마이그레이션)
4. [수동 OpenAPI 문서에서 마이그레이션](#4-수동-openapi-문서에서-마이그레이션)

---

## 1. Supertest + Swagger-JSDoc에서 마이그레이션

### 이전 방식

**이전 코드 (Swagger-JSDoc):**

```typescript
/**
 * @swagger
 * /users:
 *   post:
 *     summary: 사용자 생성
 *     tags: [users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: 생성됨
 */
describe('POST /users', () => {
  it('should create a user', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
      });

    expect(response.status).toBe(201);
  });
});
```

### jest-swagger 방식

**마이그레이션 후:**

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('사용자 API', () => {
  @Api({
    tags: ['users'],
    summary: '사용자 생성',
  })
  @Path('post', '/users')
  @Response(201, {
    description: '생성됨',
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
  test('사용자를 생성할 수 있어야 함', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
      });

    expect(response.status).toBe(201);
  });
});
```

### 주요 차이점

| 항목 | Swagger-JSDoc | jest-swagger |
|------|---------------|--------------|
| 문서 위치 | JSDoc 주석 | 데코레이터 |
| 타입 안전성 | ❌ 없음 | ✅ TypeScript 지원 |
| 테스트 통합 | 분리됨 | 통합됨 |
| 자동 생성 | 별도 설정 필요 | Jest 리포터로 자동 |
| 타입 생성 | 지원 안 함 | TypeGenerator 제공 |

### 마이그레이션 단계

#### 1단계: jest-swagger 설치

```bash
npm uninstall swagger-jsdoc
npm install --save-dev jest-swagger
```

#### 2단계: Jest 설정 업데이트

`jest.config.ts`:

```typescript
export default {
  reporters: [
    'default',
    [
      'jest-swagger/reporters',
      {
        outputPath: './docs/swagger.yaml',
        format: 'yaml',
        title: 'API 문서',
        version: '1.0.0',
      },
    ],
  ],
};
```

#### 3단계: JSDoc 주석을 데코레이터로 변환

자동 변환 스크립트를 사용할 수 있습니다:

```typescript
// scripts/migrate-from-jsdoc.ts
import * as fs from 'fs';

function convertJSDocToDecorators(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');

  // JSDoc 주석 파싱 및 데코레이터로 변환
  // (실제 변환 로직)

  fs.writeFileSync(filePath, convertedContent);
}
```

#### 4단계: 테스트 실행 및 검증

```bash
npm test
```

---

## 2. NestJS Swagger에서 마이그레이션

### 이전 방식

**이전 코드 (NestJS):**

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({ status: 201, description: '생성됨' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}

describe('UsersController', () => {
  it('should create a user', async () => {
    const result = await controller.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(result).toBeDefined();
  });
});
```

### jest-swagger 방식

**마이그레이션 후:**

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('사용자 컨트롤러', () => {
  @Api({
    tags: ['users'],
    summary: '사용자 생성',
  })
  @Path('post', '/users')
  @Response(201, {
    description: '생성됨',
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
  test('사용자를 생성할 수 있어야 함', async () => {
    const result = await controller.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(result).toBeDefined();
  });
});
```

### 주요 차이점

| 항목 | NestJS Swagger | jest-swagger |
|------|----------------|--------------|
| 적용 위치 | 컨트롤러 클래스 | 테스트 파일 |
| 프레임워크 | NestJS 전용 | 프레임워크 독립적 |
| DTO 사용 | 클래스 기반 | 스키마 기반 |
| 문서 생성 | 런타임 | 테스트 실행 시 |

### 마이그레이션 단계

#### 1단계: 기존 DTO를 스키마로 변환

**이전 (NestJS DTO):**

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}
```

**변환 후 (jest-swagger 스키마):**

```typescript
const CreateUserSchema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
};
```

#### 2단계: 컨트롤러 데코레이터를 테스트 데코레이터로 변환

변환 매핑:

- `@ApiTags()` → `@Api({ tags: [...] })`
- `@ApiOperation()` → `@Api({ summary: '...' })`
- `@ApiResponse()` → `@Response(status, { ... })`
- `@ApiParam()` → `@Parameter({ ... })`

#### 3단계: E2E 테스트에 데코레이터 추가

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('Users E2E', () => {
  @Api({
    tags: ['users'],
    summary: '사용자 생성',
  })
  @Path('post', '/users')
  @Response(201, { description: '생성됨' })
  test('POST /users', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);
  });
});
```

---

## 3. Swagger-Autogen에서 마이그레이션

### 이전 방식

**이전 코드 (Swagger-Autogen):**

```javascript
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'My API',
    description: 'API 문서',
  },
  host: 'localhost:3000',
};

const outputFile = './swagger.json';
const endpointsFiles = ['./src/routes/*.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);

// 라우트 파일
app.post('/users', (req, res) => {
  /* #swagger.tags = ['Users']
     #swagger.description = '사용자 생성' */
  res.status(201).json({ message: 'Created' });
});
```

### jest-swagger 방식

**마이그레이션 후:**

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('사용자 API', () => {
  @Api({
    tags: ['users'],
    summary: '사용자 생성',
  })
  @Path('post', '/users')
  @Response(201, {
    description: '생성됨',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  })
  test('POST /users - 사용자 생성', async () => {
    const response = await request(app).post('/users').send({
      name: 'John',
      email: 'john@example.com',
    });

    expect(response.status).toBe(201);
  });
});
```

### 마이그레이션 단계

#### 1단계: swagger-autogen 제거

```bash
npm uninstall swagger-autogen
npm install --save-dev jest-swagger
```

#### 2단계: 주석을 데코레이터로 변환

변환 매핑:

- `#swagger.tags` → `@Api({ tags: [...] })`
- `#swagger.description` → `@Api({ summary: '...' })`
- `#swagger.responses` → `@Response()`
- `#swagger.parameters` → `@Parameter()`

#### 3단계: 빌드 스크립트 업데이트

**이전:**

```json
{
  "scripts": {
    "swagger": "node swagger.js",
    "start": "npm run swagger && node app.js"
  }
}
```

**변경 후:**

```json
{
  "scripts": {
    "test": "jest",
    "start": "node app.js"
  }
}
```

---

## 4. 수동 OpenAPI 문서에서 마이그레이션

### 이전 방식

**수동으로 작성된 OpenAPI 문서 (`swagger.yaml`):**

```yaml
openapi: 3.0.0
info:
  title: 사용자 API
  version: 1.0.0
paths:
  /users:
    post:
      summary: 사용자 생성
      tags:
        - users
      responses:
        '201':
          description: 생성됨
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: number
                  name:
                    type: string
```

### jest-swagger 방식

#### 옵션 1: 기존 문서 유지 + 테스트 추가

```typescript
import { Api, Path, Response } from 'jest-swagger';

// 기존 swagger.yaml은 유지하고, 테스트에만 데코레이터 추가
describe('사용자 API', () => {
  @Api({
    tags: ['users'],
    summary: '사용자 생성',
  })
  @Path('post', '/users')
  @Response(201, {
    description: '생성됨',
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
  test('사용자 생성', async () => {
    // 테스트 코드
  });
});
```

#### 옵션 2: 기존 문서에서 타입 생성

```typescript
import { TypeGenerator } from 'jest-swagger';
import * as fs from 'fs';
import * as YAML from 'yaml';

// 기존 swagger.yaml에서 타입 생성
const swaggerContent = fs.readFileSync('./swagger.yaml', 'utf-8');
const document = YAML.parse(swaggerContent);

const generator = new TypeGenerator();
await generator.generateToFile(document, './src/types/api.generated.ts');
```

생성된 타입을 테스트에서 사용:

```typescript
import type { User, CreateUserRequest } from './types/api.generated';

test('타입 안전한 사용자 생성', async () => {
  const newUser: CreateUserRequest = {
    name: 'John',
    email: 'john@example.com',
  };

  const response = await createUser(newUser);
  const user: User = response.data;

  expect(user.id).toBeDefined();
  expect(user.name).toBe('John');
});
```

### 마이그레이션 단계

#### 1단계: 기존 문서 분석

```bash
# 기존 문서 구조 확인
cat swagger.yaml
```

#### 2단계: 타입 생성

```typescript
// scripts/generate-types.ts
import { TypeGenerator } from 'jest-swagger';
import * as fs from 'fs';
import * as YAML from 'yaml';

const swaggerContent = fs.readFileSync('./swagger.yaml', 'utf-8');
const document = YAML.parse(swaggerContent);

const generator = new TypeGenerator();
await generator.generateToFile(document, './src/types/api.generated.ts');
```

#### 3단계: 테스트에 데코레이터 추가

기존 엔드포인트별로 테스트를 작성하고 데코레이터를 추가합니다.

#### 4단계: Jest 리포터 설정

```typescript
// jest.config.ts
export default {
  reporters: [
    'default',
    [
      'jest-swagger/reporters',
      {
        outputPath: './swagger.yaml',
        format: 'yaml',
        title: 'API 문서',
        version: '1.0.0',
      },
    ],
  ],
};
```

#### 5단계: 점진적 마이그레이션

1. 새로운 엔드포인트부터 jest-swagger 사용
2. 기존 엔드포인트는 필요에 따라 순차적으로 마이그레이션
3. 생성된 문서와 기존 문서 비교하여 일관성 확인

---

## 일반적인 마이그레이션 팁

### 1. 타입 안전성 활용

jest-swagger의 가장 큰 장점은 TypeScript 타입 안전성입니다.

```typescript
// 타입 생성
await generator.generateToFile(document, './types/api.ts');

// 테스트에서 사용
import type { User } from './types/api';

test('타입 안전한 테스트', async () => {
  const user: User = await getUser(1);
  expect(user.name).toBeDefined();
});
```

### 2. 점진적 마이그레이션

한 번에 모든 것을 마이그레이션하지 말고, 점진적으로 진행하세요.

1. 새로운 API부터 jest-swagger 사용
2. 중요한 API 우선 마이그레이션
3. 레거시 API는 필요시 마이그레이션

### 3. 자동화 스크립트 활용

반복적인 작업은 스크립트로 자동화하세요.

```typescript
// scripts/migrate.ts
import * as fs from 'fs';

function migrateSwaggerJsDoc(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');

  // JSDoc 주석 찾기
  const jsdocPattern = /\/\*\*\s*\n\s*\*\s*@swagger\s*\n([\s\S]*?)\*\//g;

  // 데코레이터로 변환
  // ...

  fs.writeFileSync(filePath, convertedContent);
}
```

### 4. 문서 일관성 검증

마이그레이션 후 생성된 문서와 기존 문서를 비교하여 일관성을 확인하세요.

```bash
# 기존 문서와 새 문서 비교
diff old-swagger.yaml new-swagger.yaml
```

### 5. CI/CD 통합

Jest 리포터를 CI/CD 파이프라인에 통합하여 자동으로 문서를 생성하세요.

```yaml
# .github/workflows/test.yml
- name: Run tests and generate docs
  run: npm test

- name: Upload OpenAPI docs
  uses: actions/upload-artifact@v2
  with:
    name: openapi-docs
    path: ./docs/swagger.yaml
```

---

## 문제 해결

### Q1: 기존 스키마 재사용이 가능한가요?

**A:** 네, `$ref`를 사용하여 기존 스키마를 참조할 수 있습니다.

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

### Q2: 여러 파일에서 공통 스키마를 사용하려면?

**A:** 별도 파일에서 스키마를 정의하고 import하여 사용하세요.

```typescript
// schemas/user.schema.ts
export const UserSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
  },
};

// tests/users.test.ts
import { UserSchema } from '../schemas/user.schema';

@Response(200, {
  description: '성공',
  content: {
    'application/json': {
      schema: UserSchema,
    },
  },
})
```

### Q3: 마이그레이션 후 문서가 생성되지 않아요

**A:** Jest 리포터 설정을 확인하세요.

```typescript
// jest.config.ts
export default {
  reporters: [
    'default',
    [
      'jest-swagger/reporters', // 올바른 경로 확인
      {
        outputPath: './docs/swagger.yaml',
        format: 'yaml',
      },
    ],
  ],
};
```

---

## 추가 리소스

- [API 문서](./API.md)
- [튜토리얼](./TUTORIAL.md)
- [예제](../examples)
- [GitHub Issues](https://github.com/your-repo/jest-swagger/issues)
