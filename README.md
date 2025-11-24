# jest-swagger

**English** | [한국어](./README.ko.md)

A TypeScript library for automatically generating Swagger/OpenAPI documentation from Jest tests

## Overview

`jest-swagger` is a tool that automatically generates OpenAPI 3.0 documentation using decorators and builder patterns in Jest test code. You can create API documentation while writing API tests, ensuring consistency between documentation and code.

## Key Features

- ✅ **Decorator-based Documentation**: Declarative API documentation using TypeScript decorators
- ✅ **Builder Pattern Support**: Flexible Swagger document construction with builder API
- ✅ **Jest Integration**: Seamless integration with Jest testing environment
- ✅ **OpenAPI 3.0 Support**: Compliant with latest OpenAPI 3.0 specification
- ✅ **TypeScript First**: Full type safety and IntelliSense support
- ✅ **Multiple Output Formats**: Export documentation in JSON and YAML formats
- ✅ **Advanced Validation**: Automatic schema and response validation

## Installation

```bash
npm install --save-dev jest-swagger
```

Or using yarn:

```bash
yarn add -D jest-swagger
```

## Quick Start

### 1. API Documentation with Decorators

```typescript
import { SwaggerTest, ApiEndpoint, ApiResponse } from 'jest-swagger';

@SwaggerTest({
  title: 'User API',
  version: '1.0.0',
  description: 'User Management API'
})
describe('User API', () => {
  @ApiEndpoint({
    method: 'GET',
    path: '/users/{id}',
    summary: 'Get user information',
    tags: ['users']
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' }
      }
    }
  })
  it('should get user by id', async () => {
    // Test code
  });
});
```

### 2. Document Generation with Builder Pattern

```typescript
import { SwaggerBuilder } from 'jest-swagger';

const swagger = new SwaggerBuilder()
  .setInfo({
    title: 'My API',
    version: '1.0.0',
    description: 'API Description'
  })
  .addPath('/users', {
    get: {
      summary: 'Get user list',
      responses: {
        200: {
          description: 'Success'
        }
      }
    }
  })
  .build();
```

### 3. Document Generation and Output

```typescript
import { SwaggerReporter } from 'jest-swagger';

const reporter = new SwaggerReporter({
  outputDir: './docs',
  format: 'yaml'
});

reporter.generate();
```

## Project Structure

```
jest-swagger/
├── src/
│   ├── decorators/       # Decorator implementations
│   ├── builders/         # Builder pattern implementations
│   ├── reporters/        # Document generation and output
│   ├── types/            # TypeScript type definitions
│   └── integrations/     # External integrations (Jest, Express, etc.)
├── tests/                # Test files
│   ├── decorators/
│   ├── builders/
│   ├── reporters/
│   ├── types/
│   ├── helpers/
│   └── fixtures/
├── docs/                 # Documentation
└── examples/             # Example code
```

## Development Environment Setup

### Requirements

- Node.js >= 16.0.0
- TypeScript >= 5.0.0
- Jest >= 29.0.0

### Development Scripts

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Lint check
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Code formatting
npm run format

# Type check
npm run typecheck
```

## Test Coverage

This project targets 95% or higher code coverage:

- Branches: 95%
- Functions: 95%
- Lines: 95%
- Statements: 95%

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Comply with TypeScript strict mode
- Write tests for all code
- Follow ESLint and Prettier rules
- Write clear and descriptive commit messages

## Roadmap

- [ ] Basic decorator implementation (@SwaggerTest, @ApiEndpoint, @ApiResponse)
- [ ] SwaggerBuilder implementation
- [ ] Jest Reporter integration
- [ ] OpenAPI 3.0 schema validation
- [ ] Express.js integration
- [ ] NestJS integration
- [ ] Fastify integration
- [ ] Advanced schema generation (auto-generate from TypeScript types)
- [ ] Documentation UI integration (Swagger UI, ReDoc)

## Publishing

This package is automatically published to NPM using GitHub Actions.

### For Maintainers

See [NPM Publishing Guide](.github/NPM_PUBLISH_GUIDE.md) for detailed instructions on:

- Setting up GitHub Secrets (Organization Secret or Repository Secret)
- Publishing new versions
- Troubleshooting publishing issues

**Quick publish:**

```bash
npm version patch  # or minor, major
git push --tags
```

## License

MIT License

## Author

[Author Name]

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/jest-swagger/issues)
- Documentation: [Documentation](https://github.com/yourusername/jest-swagger/wiki)
