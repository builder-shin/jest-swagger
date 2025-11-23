# Contributing to jest-swagger

[한국어](./CONTRIBUTING.md) | **English**

Thank you for your interest in contributing to the jest-swagger project!

## Development Environment Setup

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/jest-swagger.git
cd jest-swagger

# Install dependencies
npm install

# Verify build
npm run build

# Run tests
npm test
```

## Development Workflow

### 1. Create Branch

```bash
# For feature development
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/bug-description

# For documentation updates
git checkout -b docs/documentation-update
```

### 2. Write Code

#### Code Style

- Follow TypeScript strict mode
- Adhere to ESLint and Prettier rules
- Use meaningful variable and function names
- Add comments for complex logic

#### Write Tests

All new features and bug fixes require tests:

```typescript
describe('YourFeature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = yourFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### 3. Code Validation

Run the following before submitting:

```bash
# Lint check
npm run lint

# Type check
npm run typecheck

# Run tests (with coverage)
npm run test:coverage

# Code formatting
npm run format
```

### 4. Commit

Commit messages follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation change
- `style`: Code formatting (no functionality change)
- `refactor`: Refactoring
- `test`: Add/modify tests
- `chore`: Build process or tool changes

**Example:**

```
feat(decorators): add @ApiParameter decorator

- Add new decorator for API parameter documentation
- Support query, path, header, and cookie parameters
- Include validation and type checking

Closes #123
```

### 5. Pull Request

1. Sync with latest main branch
```bash
git fetch origin
git rebase origin/main
```

2. Push changes
```bash
git push origin feature/your-feature-name
```

3. Create Pull Request on GitHub
   - Write clear title and description
   - Reference related issue numbers
   - Include screenshots or example code (if needed)

## Code Review Process

1. Requires approval from at least 1 reviewer
2. All CI checks must pass
3. Maintain code coverage above 95%
4. Resolve conflicts and stay up to date

## Coverage Requirements

The project maintains the following coverage levels:

- Branches: 95%
- Functions: 95%
- Lines: 95%
- Statements: 95%

## Documentation

### Code Documentation

All public APIs require JSDoc comments:

```typescript
/**
 * Builder class for generating Swagger documents
 *
 * @example
 * ```typescript
 * const builder = new SwaggerBuilder()
 *   .setInfo({ title: 'My API', version: '1.0.0' })
 *   .build();
 * ```
 */
export class SwaggerBuilder {
  /**
   * Sets API information
   *
   * @param info - OpenAPI info object
   * @returns Builder instance for chaining
   */
  setInfo(info: OpenAPIInfo): this {
    // Implementation
  }
}
```

### README Updates

Update README.md when adding new features.

## Issue Reporting

Found a bug or want to suggest a feature?

### Bug Report

Please include the following information:

1. Bug description
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Environment information (Node.js version, OS, etc.)
6. Minimal reproduction code (if possible)

### Feature Suggestion

Please include the following information:

1. Feature description
2. Use cases
3. Expected API design
4. Alternative considerations

## Questions or Need Help?

- Use GitHub Discussions
- Register an issue with 'question' label
- Check related documentation

## Code of Conduct

- Maintain respectful and inclusive environment
- Provide constructive feedback
- Respect diverse perspectives
- Prioritize project and community interests

Thank you! 🎉
