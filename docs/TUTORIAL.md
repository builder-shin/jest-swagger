# jest-swagger Tutorial

**English** | [한국어](./TUTORIAL.ko.md)

This tutorial provides a step-by-step guide on how to automatically generate OpenAPI documentation from Jest tests using jest-swagger.

## Table of Contents

1. [Installation](#1-installation)
2. [Basic Setup](#2-basic-setup)
3. [Writing Your First API Test](#3-writing-your-first-api-test)
4. [Defining Parameters](#4-defining-parameters)
5. [Defining Responses](#5-defining-responses)
6. [Generating Types](#6-generating-types)
7. [Advanced Features](#7-advanced-features)

---

## 1. Installation

Install jest-swagger using npm:

```bash
npm install --save-dev jest-swagger
```

Or using yarn:

```bash
yarn add --dev jest-swagger
```

---

## 2. Basic Setup

### Jest Configuration

Create a `jest.config.ts` file and add the SwaggerReporter:

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
        title: 'User Management API',
        version: '1.0.0',
        description: 'User creation, retrieval, update, and deletion API',
      },
    ],
  ],
};

export default config;
```

### TypeScript Configuration

Enable decorator support in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## 3. Writing Your First API Test

Let's write a simple user creation API test.

### Test File: `tests/users.test.ts`

```typescript
import { Api, Path, Response } from 'jest-swagger';

describe('User Management API', () => {
  @Api({
    tags: ['users'],
    summary: 'Create a user',
    description: 'Creates a new user.',
  })
  @Path('post', '/users')
  @Response(201, {
    description: 'User successfully created',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'User ID' },
            name: { type: 'string', description: 'User name' },
            email: { type: 'string', description: 'Email address' },
          },
        },
        example: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    },
  })
  test('POST /users - Create a user', async () => {
    // Actual API call or mock test
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name', 'John Doe');
    expect(data).toHaveProperty('email', 'john@example.com');
  });
});
```

### Running Tests

```bash
npm test
```

When tests run, the `docs/swagger.yaml` file will be automatically generated.

---

## 4. Defining Parameters

Now let's write API tests with parameters.

### Path Parameters

```typescript
import { Api, Path, Parameter, Response } from 'jest-swagger';

@Api({
  tags: ['users'],
  summary: 'Get a user',
  description: 'Retrieves a specific user by ID.',
})
@Path('get', '/users/{id}')
@Parameter({
  name: 'id',
  in: 'path',
  description: 'User ID',
  required: true,
  schema: { type: 'number' },
  example: 1,
})
@Response(200, {
  description: 'Success',
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
  description: 'User not found',
})
test('GET /users/{id} - Get a user', async () => {
  const response = await fetch('http://localhost:3000/users/1');
  expect(response.status).toBe(200);
});
```

### Query Parameters

```typescript
@Api({
  tags: ['users'],
  summary: 'Get user list',
  description: 'Retrieves a paginated list of users.',
})
@Path('get', '/users')
@Parameter({
  name: 'page',
  in: 'query',
  description: 'Page number',
  schema: { type: 'number', minimum: 1 },
  example: 1,
})
@Parameter({
  name: 'limit',
  in: 'query',
  description: 'Items per page',
  schema: { type: 'number', minimum: 1, maximum: 100 },
  example: 10,
})
@Response(200, {
  description: 'Success',
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
test('GET /users - Get user list', async () => {
  const response = await fetch('http://localhost:3000/users?page=1&limit=10');
  expect(response.status).toBe(200);
});
```

### Header Parameters

```typescript
@Api({
  tags: ['users'],
  summary: 'Get authenticated user information',
})
@Path('get', '/me')
@Parameter({
  name: 'Authorization',
  in: 'header',
  description: 'Authentication token',
  required: true,
  schema: { type: 'string' },
  example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
})
@Response(200, {
  description: 'Success',
})
@Response(401, {
  description: 'Authentication failed',
})
test('GET /me - Get my information', async () => {
  const response = await fetch('http://localhost:3000/me', {
    headers: {
      Authorization: 'Bearer token123',
    },
  });
  expect(response.status).toBe(200);
});
```

---

## 5. Defining Responses

Let's define various response scenarios.

### Success Responses

```typescript
@Response(200, {
  description: 'Success',
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
          name: 'John Doe',
        },
      },
    },
  },
})
```

### Error Responses

```typescript
@Response(400, {
  description: 'Bad request',
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
          message: 'Email format is invalid.',
        },
      },
    },
  },
})
```

---

## 6. Generating Types

You can automatically generate TypeScript types from your OpenAPI documentation.

### Type Generation Script

Create a `scripts/generate-types.ts` file:

```typescript
import { TypeGenerator } from 'jest-swagger';
import * as fs from 'fs';
import * as YAML from 'yaml';

async function generateTypes() {
  // Load OpenAPI document
  const swaggerContent = fs.readFileSync('./docs/swagger.yaml', 'utf-8');
  const document = YAML.parse(swaggerContent);

  // Generate TypeScript types
  const generator = new TypeGenerator();
  await generator.generateToFile(document, './src/types/api.generated.ts');

  console.log('✅ Types successfully generated.');
}

generateTypes().catch(console.error);
```

### Add package.json Script

```json
{
  "scripts": {
    "generate-types": "ts-node scripts/generate-types.ts"
  }
}
```

### Run Type Generation

```bash
npm run generate-types
```

### Using Generated Types

```typescript
import type { User, UserRole } from './types/api.generated';

function createUser(data: User): void {
  console.log('Creating user:', data);
}

const role: UserRole = 'admin';
```

---

## 7. Advanced Features

### Nested Object Schemas

```typescript
@Response(200, {
  description: 'Success',
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

### Array Responses

```typescript
@Response(200, {
  description: 'Success',
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

### Enum Types

```typescript
@Response(200, {
  description: 'Success',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['admin', 'user', 'guest'],
            description: 'User role',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
            description: 'User status',
          },
        },
      },
    },
  },
})
```

### Validation Rules

```typescript
@Response(200, {
  description: 'Success',
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
            description: 'User name',
          },
          age: {
            type: 'number',
            minimum: 0,
            maximum: 150,
            description: 'Age',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email',
          },
        },
      },
    },
  },
})
```

### Using $ref References

You can define reusable schemas using the document builder:

```typescript
import { DocumentBuilder } from 'jest-swagger';

const document = new DocumentBuilder()
  .setTitle('User Management API')
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

Then reference it in responses:

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

---

## Next Steps

- Check out the [API Documentation](./API.md) for all decorators and options.
- Explore real-world use cases in the [example projects](../examples).
- Learn how to migrate from other tools in the [Migration Guide](./MIGRATION.md).
