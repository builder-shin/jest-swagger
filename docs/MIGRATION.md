# Migration Guide

**English** | [한국어](./MIGRATION.ko.md)

This guide helps you migrate to jest-swagger from other tools.

## Table of Contents

1. [Migrating from Supertest + Swagger-JSDoc](#1-migrating-from-supertest--swagger-jsdoc)
2. [Migrating from NestJS Swagger](#2-migrating-from-nestjs-swagger)
3. [Migrating from Swagger-Autogen](#3-migrating-from-swagger-autogen)
4. [Migrating from Manual OpenAPI Documentation](#4-migrating-from-manual-openapi-documentation)

---

## 1. Migrating from Supertest + Swagger-JSDoc

### Previous Approach

**Previous Code (Swagger-JSDoc):**

```typescript
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create user
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
 *         description: Created
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

### jest-swagger Approach

**After Migration:**

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('User API', () => {
  @Api({
    tags: ['users'],
    summary: 'Create user',
  })
  @Path('post', '/users')
  @Response(201, {
    description: 'Created',
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
  test('should create a user', async () => {
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

### Key Differences

| Item | Swagger-JSDoc | jest-swagger |
|------|---------------|--------------|
| Documentation Location | JSDoc comments | Decorators |
| Type Safety | ❌ None | ✅ TypeScript support |
| Test Integration | Separated | Integrated |
| Auto Generation | Requires separate setup | Automatic via Jest reporter |
| Type Generation | Not supported | TypeGenerator provided |

### Migration Steps

#### Step 1: Install jest-swagger

```bash
npm uninstall swagger-jsdoc
npm install --save-dev jest-swagger
```

#### Step 2: Update Jest Configuration

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
        title: 'API Documentation',
        version: '1.0.0',
      },
    ],
  ],
};
```

#### Step 3: Convert JSDoc Comments to Decorators

You can use an automated conversion script:

```typescript
// scripts/migrate-from-jsdoc.ts
import * as fs from 'fs';

function convertJSDocToDecorators(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Parse JSDoc comments and convert to decorators
  // (actual conversion logic)

  fs.writeFileSync(filePath, convertedContent);
}
```

#### Step 4: Run Tests and Verify

```bash
npm test
```

---

## 2. Migrating from NestJS Swagger

### Previous Approach

**Previous Code (NestJS):**

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'Created' })
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

### jest-swagger Approach

**After Migration:**

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('User Controller', () => {
  @Api({
    tags: ['users'],
    summary: 'Create user',
  })
  @Path('post', '/users')
  @Response(201, {
    description: 'Created',
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
  test('should create a user', async () => {
    const result = await controller.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(result).toBeDefined();
  });
});
```

### Key Differences

| Item | NestJS Swagger | jest-swagger |
|------|----------------|--------------|
| Application Location | Controller classes | Test files |
| Framework | NestJS-specific | Framework-agnostic |
| DTO Usage | Class-based | Schema-based |
| Documentation Generation | Runtime | During test execution |

### Migration Steps

#### Step 1: Convert Existing DTOs to Schemas

**Previous (NestJS DTO):**

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}
```

**After Conversion (jest-swagger schema):**

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

#### Step 2: Convert Controller Decorators to Test Decorators

Conversion mapping:

- `@ApiTags()` → `@Api({ tags: [...] })`
- `@ApiOperation()` → `@Api({ summary: '...' })`
- `@ApiResponse()` → `@Response(status, { ... })`
- `@ApiParam()` → `@Parameter({ ... })`

#### Step 3: Add Decorators to E2E Tests

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('Users E2E', () => {
  @Api({
    tags: ['users'],
    summary: 'Create user',
  })
  @Path('post', '/users')
  @Response(201, { description: 'Created' })
  test('POST /users', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);
  });
});
```

---

## 3. Migrating from Swagger-Autogen

### Previous Approach

**Previous Code (Swagger-Autogen):**

```javascript
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'My API',
    description: 'API Documentation',
  },
  host: 'localhost:3000',
};

const outputFile = './swagger.json';
const endpointsFiles = ['./src/routes/*.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);

// Route file
app.post('/users', (req, res) => {
  /* #swagger.tags = ['Users']
     #swagger.description = 'Create user' */
  res.status(201).json({ message: 'Created' });
});
```

### jest-swagger Approach

**After Migration:**

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('User API', () => {
  @Api({
    tags: ['users'],
    summary: 'Create user',
  })
  @Path('post', '/users')
  @Response(201, {
    description: 'Created',
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
  test('POST /users - Create user', async () => {
    const response = await request(app).post('/users').send({
      name: 'John',
      email: 'john@example.com',
    });

    expect(response.status).toBe(201);
  });
});
```

### Migration Steps

#### Step 1: Remove swagger-autogen

```bash
npm uninstall swagger-autogen
npm install --save-dev jest-swagger
```

#### Step 2: Convert Comments to Decorators

Conversion mapping:

- `#swagger.tags` → `@Api({ tags: [...] })`
- `#swagger.description` → `@Api({ summary: '...' })`
- `#swagger.responses` → `@Response()`
- `#swagger.parameters` → `@Parameter()`

#### Step 3: Update Build Scripts

**Previous:**

```json
{
  "scripts": {
    "swagger": "node swagger.js",
    "start": "npm run swagger && node app.js"
  }
}
```

**After:**

```json
{
  "scripts": {
    "test": "jest",
    "start": "node app.js"
  }
}
```

---

## 4. Migrating from Manual OpenAPI Documentation

### Previous Approach

**Manually Written OpenAPI Documentation (`swagger.yaml`):**

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
paths:
  /users:
    post:
      summary: Create user
      tags:
        - users
      responses:
        '201':
          description: Created
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

### jest-swagger Approach

#### Option 1: Keep Existing Documentation + Add Tests

```typescript
import { Api, Path, Response } from 'jest-swagger';

// Keep existing swagger.yaml and only add decorators to tests
describe('User API', () => {
  @Api({
    tags: ['users'],
    summary: 'Create user',
  })
  @Path('post', '/users')
  @Response(201, {
    description: 'Created',
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
  test('Create user', async () => {
    // Test code
  });
});
```

#### Option 2: Generate Types from Existing Documentation

```typescript
import { TypeGenerator } from 'jest-swagger';
import * as fs from 'fs';
import * as YAML from 'yaml';

// Generate types from existing swagger.yaml
const swaggerContent = fs.readFileSync('./swagger.yaml', 'utf-8');
const document = YAML.parse(swaggerContent);

const generator = new TypeGenerator();
await generator.generateToFile(document, './src/types/api.generated.ts');
```

Use generated types in tests:

```typescript
import type { User, CreateUserRequest } from './types/api.generated';

test('Type-safe user creation', async () => {
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

### Migration Steps

#### Step 1: Analyze Existing Documentation

```bash
# Check existing document structure
cat swagger.yaml
```

#### Step 2: Generate Types

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

#### Step 3: Add Decorators to Tests

Write tests for each existing endpoint and add decorators.

#### Step 4: Configure Jest Reporter

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
        title: 'API Documentation',
        version: '1.0.0',
      },
    ],
  ],
};
```

#### Step 5: Gradual Migration

1. Use jest-swagger for new endpoints first
2. Migrate existing endpoints sequentially as needed
3. Compare generated documentation with existing documentation to verify consistency

---

## General Migration Tips

### 1. Leverage Type Safety

The biggest advantage of jest-swagger is TypeScript type safety.

```typescript
// Generate types
await generator.generateToFile(document, './types/api.ts');

// Use in tests
import type { User } from './types/api';

test('Type-safe test', async () => {
  const user: User = await getUser(1);
  expect(user.name).toBeDefined();
});
```

### 2. Gradual Migration

Don't migrate everything at once; proceed gradually.

1. Use jest-swagger for new APIs first
2. Migrate critical APIs with priority
3. Migrate legacy APIs as needed

### 3. Use Automation Scripts

Automate repetitive tasks with scripts.

```typescript
// scripts/migrate.ts
import * as fs from 'fs';

function migrateSwaggerJsDoc(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find JSDoc comments
  const jsdocPattern = /\/\*\*\s*\n\s*\*\s*@swagger\s*\n([\s\S]*?)\*\//g;

  // Convert to decorators
  // ...

  fs.writeFileSync(filePath, convertedContent);
}
```

### 4. Verify Documentation Consistency

Compare generated documentation with existing documentation after migration to verify consistency.

```bash
# Compare old and new documentation
diff old-swagger.yaml new-swagger.yaml
```

### 5. CI/CD Integration

Integrate Jest reporter into your CI/CD pipeline to automatically generate documentation.

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

## Troubleshooting

### Q1: Can I reuse existing schemas?

**A:** Yes, you can reference existing schemas using `$ref`.

```typescript
@Response(200, {
  description: 'Success',
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/User',
      },
    },
  },
})
```

### Q2: How to use common schemas across multiple files?

**A:** Define schemas in a separate file and import them.

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
  description: 'Success',
  content: {
    'application/json': {
      schema: UserSchema,
    },
  },
})
```

### Q3: Documentation is not being generated after migration

**A:** Check your Jest reporter configuration.

```typescript
// jest.config.ts
export default {
  reporters: [
    'default',
    [
      'jest-swagger/reporters', // Verify correct path
      {
        outputPath: './docs/swagger.yaml',
        format: 'yaml',
      },
    ],
  ],
};
```

---

## Additional Resources

- [API Documentation](./API.md)
- [Tutorial](./TUTORIAL.md)
- [Examples](../examples)
- [GitHub Issues](https://github.com/your-repo/jest-swagger/issues)
