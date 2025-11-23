# jest-swagger API Documentation

[한국어](./API.md) | **English**

## Table of Contents

1. [Decorators](#decorators)
2. [Builders](#builders)
3. [Reporters](#reporters)
4. [Type Generators](#type-generators)
5. [Integrations](#integrations)

---

## Decorators

### @Api

Adds API information to a class or function.

**Signature:**
```typescript
@Api(options: ApiDecoratorOptions)
```

**Options:**
```typescript
interface ApiDecoratorOptions {
  tags?: string[];        // API tags
  summary?: string;       // Summary description
  description?: string;   // Detailed description
  deprecated?: boolean;   // Deprecated flag
}
```

**Example:**
```typescript
import { Api } from 'jest-swagger';

@Api({
  tags: ['users'],
  summary: 'Create user',
  description: 'Creates a new user.',
})
test('POST /users - Create user', async () => {
  // Test code
});
```

---

### @Path

Specifies the HTTP path and method.

**Signature:**
```typescript
@Path(method: HttpMethod, path: string)
```

**HTTP Methods:**
- `'get'`
- `'post'`
- `'put'`
- `'delete'`
- `'patch'`
- `'options'`
- `'head'`

**Example:**
```typescript
import { Path } from 'jest-swagger';

@Path('post', '/users')
test('Create user', async () => {
  // Test code
});

@Path('get', '/users/{id}')
test('Get user', async () => {
  // Test code
});
```

---

### @Parameter

Defines API parameters.

**Signature:**
```typescript
@Parameter(options: ParameterDecoratorOptions)
```

**Options:**
```typescript
interface ParameterDecoratorOptions {
  name: string;                           // Parameter name
  in: 'query' | 'header' | 'path' | 'cookie';  // Parameter location
  description?: string;                   // Description
  required?: boolean;                     // Required flag
  schema?: SchemaObject;                  // Schema definition
  example?: unknown;                      // Example value
}
```

**Example:**
```typescript
import { Parameter } from 'jest-swagger';

@Parameter({
  name: 'id',
  in: 'path',
  description: 'User ID',
  required: true,
  schema: { type: 'number' },
  example: 123,
})
@Parameter({
  name: 'limit',
  in: 'query',
  description: 'Number of items to retrieve',
  schema: { type: 'number', minimum: 1, maximum: 100 },
  example: 10,
})
test('GET /users/{id} - Get user', async () => {
  // Test code
});
```

---

### @Response

Defines API responses.

**Signature:**
```typescript
@Response(statusCode: number, options: ResponseDecoratorOptions)
```

**Options:**
```typescript
interface ResponseDecoratorOptions {
  description: string;                    // Response description
  content?: {                             // Response content
    [mediaType: string]: {
      schema: SchemaObject;
      example?: unknown;
    };
  };
}
```

**Example:**
```typescript
import { Response } from 'jest-swagger';

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
      example: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
  },
})
@Response(404, {
  description: 'User not found',
})
test('GET /users/{id} - Get user', async () => {
  // Test code
});
```

---

## Builders

### DocumentBuilder

Generates OpenAPI documents.

**Methods:**

#### `setTitle(title: string): this`
Sets the API document title.

#### `setVersion(version: string): this`
Sets the API version.

#### `setDescription(description: string): this`
Sets the API description.

#### `addServer(url: string, description?: string): this`
Adds server information.

#### `addTag(name: string, description?: string): this`
Adds a tag.

#### `build(): OpenAPIDocument`
Builds the OpenAPI document.

**Example:**
```typescript
import { DocumentBuilder } from 'jest-swagger';

const document = new DocumentBuilder()
  .setTitle('User Management API')
  .setVersion('1.0.0')
  .setDescription('API for creating, retrieving, updating, and deleting users')
  .addServer('http://localhost:3000', 'Development server')
  .addServer('https://api.example.com', 'Production server')
  .addTag('users', 'User management')
  .addTag('auth', 'Authentication')
  .build();
```

---

### SchemaInference

Infers OpenAPI schemas from runtime values.

**Methods:**

#### `inferSchema(value: unknown): SchemaObject`
Infers schema from a value.

**Example:**
```typescript
import { SchemaInference } from 'jest-swagger';

const inference = new SchemaInference();

// Infer schema from object
const userSchema = inference.inferSchema({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  isActive: true,
});

// Result:
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

## Reporters

### SwaggerReporter

Jest reporter that automatically generates OpenAPI documents during test execution.

**Configuration:**

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
        title: 'API Documentation',
        version: '1.0.0',
      },
    ],
  ],
};
```

---

## Type Generators

### TypeGenerator

Automatically generates TypeScript types from OpenAPI documents.

**Methods:**

#### `generateType(schema: SchemaObject, typeName: string): string`
Generates types from a schema.

#### `generateFromDocument(document: OpenAPIDocument): string`
Generates types from an entire OpenAPI document.

#### `generateToFile(document: OpenAPIDocument, outputPath: string): Promise<void>`
Saves type definitions to a file.

**Example:**

```typescript
import { TypeGenerator } from 'jest-swagger';
import * as fs from 'fs';

const generator = new TypeGenerator();

// Load OpenAPI document
const document = JSON.parse(fs.readFileSync('./swagger.json', 'utf-8'));

// Generate TypeScript types
await generator.generateToFile(document, './types/api.ts');
```

**Generated Type Example:**

```typescript
/**
 * Generated types from User Management API
 * Version: 1.0.0
 * @generated This file is auto-generated. Do not edit manually.
 */

/**
 * User information
 */
export interface User {
  /** User ID */
  id: number;
  /** User name */
  name: string;
  /** Email */
  email?: string;
  /** Active status */
  isActive?: boolean;
}

/**
 * User role
 */
export type UserRole = 'admin' | 'user' | 'guest';
```

**Validation Rule Annotations:**

```typescript
/**
 * User name
 * @minLength 3
 * @maxLength 50
 * @pattern ^[a-zA-Z가-힣]+$
 */
export type UserName = string;

/**
 * Age
 * @minimum 0
 * @maximum 150
 */
export type Age = number;
```

---

## Integrations

### Express Integration

Integrates with Express apps to serve Swagger UI.

```typescript
import express from 'express';
import { setupSwagger } from 'jest-swagger/integrations';

const app = express();

setupSwagger(app, {
  swaggerPath: './swagger.yaml',
  uiPath: '/api-docs',
  title: 'API Documentation',
});

app.listen(3000, () => {
  console.log('Server started.');
  console.log('Swagger UI: http://localhost:3000/api-docs');
});
```

### Fastify Integration

```typescript
import Fastify from 'fastify';
import { setupSwaggerForFastify } from 'jest-swagger/integrations';

const fastify = Fastify();

await setupSwaggerForFastify(fastify, {
  swaggerPath: './swagger.yaml',
  uiPath: '/api-docs',
  title: 'API Documentation',
});

await fastify.listen({ port: 3000 });
```

---

## Type Definitions

### SchemaObject

Type representing an OpenAPI schema.

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

  // Number validation
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  // String validation
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Array validation
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Object validation
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | SchemaObject;
}
```

---

## Example Projects

For complete examples, refer to the [examples](../examples) directory.

- [Basic Usage](../examples/basic-usage)
- [Express Integration](../examples/express-integration)
- [Type Generation](../examples/type-generation)
- [Complex API](../examples/complex-api)
