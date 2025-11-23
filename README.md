# jest-swagger

**한국어** | [English](./README.en.md)

Jest 테스트에서 Swagger/OpenAPI 문서를 자동 생성하는 TypeScript 라이브러리

## 개요

`jest-swagger`는 Jest 테스트 코드에서 데코레이터와 빌더 패턴을 사용하여 OpenAPI 3.0 문서를 자동으로 생성하는 도구입니다. API 테스트를 작성하면서 동시에 API 문서를 생성할 수 있어, 문서와 코드의 일관성을 보장합니다.

## 주요 기능

- ✅ **데코레이터 기반 문서 생성**: TypeScript 데코레이터를 사용한 선언적 API 문서화
- ✅ **빌더 패턴 지원**: 유연한 Swagger 문서 구축을 위한 빌더 API
- ✅ **Jest 통합**: Jest 테스트 환경과 완벽하게 통합
- ✅ **OpenAPI 3.0 지원**: 최신 OpenAPI 3.0 스펙 준수
- ✅ **TypeScript 우선**: 완전한 타입 안전성과 IntelliSense 지원
- ✅ **다중 출력 형식**: JSON, YAML 형식으로 문서 출력
- ✅ **고급 검증**: 스키마 및 응답 자동 검증

## 설치

```bash
npm install --save-dev jest-swagger
```

또는

```bash
yarn add -D jest-swagger
```

## 빠른 시작

### 1. 데코레이터를 사용한 API 문서화

```typescript
import { SwaggerTest, ApiEndpoint, ApiResponse } from 'jest-swagger';

@SwaggerTest({
  title: 'User API',
  version: '1.0.0',
  description: '사용자 관리 API'
})
describe('User API', () => {
  @ApiEndpoint({
    method: 'GET',
    path: '/users/{id}',
    summary: '사용자 정보 조회',
    tags: ['users']
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
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
    // 테스트 코드
  });
});
```

### 2. 빌더 패턴을 사용한 문서 생성

```typescript
import { SwaggerBuilder } from 'jest-swagger';

const swagger = new SwaggerBuilder()
  .setInfo({
    title: 'My API',
    version: '1.0.0',
    description: 'API 설명'
  })
  .addPath('/users', {
    get: {
      summary: '사용자 목록 조회',
      responses: {
        200: {
          description: '성공'
        }
      }
    }
  })
  .build();
```

### 3. 문서 생성 및 출력

```typescript
import { SwaggerReporter } from 'jest-swagger';

const reporter = new SwaggerReporter({
  outputDir: './docs',
  format: 'yaml'
});

reporter.generate();
```

## 프로젝트 구조

```
jest-swagger/
├── src/
│   ├── decorators/       # 데코레이터 구현
│   ├── builders/         # 빌더 패턴 구현
│   ├── reporters/        # 문서 생성 및 출력
│   ├── types/            # TypeScript 타입 정의
│   └── integrations/     # 외부 통합 (Jest, Express 등)
├── tests/                # 테스트 파일
│   ├── decorators/
│   ├── builders/
│   ├── reporters/
│   ├── types/
│   ├── helpers/
│   └── fixtures/
├── docs/                 # 문서
└── examples/             # 예제 코드
```

## 개발 환경 설정

### 요구사항

- Node.js >= 16.0.0
- TypeScript >= 5.0.0
- Jest >= 29.0.0

### 개발 스크립트

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 테스트 실행
npm test

# 커버리지 포함 테스트
npm run test:coverage

# Watch 모드로 테스트
npm run test:watch

# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 코드 포맷팅
npm run format

# 타입 체크
npm run typecheck
```

## 테스트 커버리지

이 프로젝트는 95% 이상의 코드 커버리지를 목표로 합니다.

- Branches: 95%
- Functions: 95%
- Lines: 95%
- Statements: 95%

## 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 개발 가이드라인

- TypeScript strict mode 준수
- 모든 코드에 대한 테스트 작성
- ESLint 및 Prettier 규칙 준수
- 커밋 메시지는 명확하고 설명적으로 작성

## 로드맵

- [ ] 기본 데코레이터 구현 (@SwaggerTest, @ApiEndpoint, @ApiResponse)
- [ ] SwaggerBuilder 구현
- [ ] Jest Reporter 통합
- [ ] OpenAPI 3.0 스키마 검증
- [ ] Express.js 통합
- [ ] NestJS 통합
- [ ] Fastify 통합
- [ ] 고급 스키마 생성 (TypeScript 타입에서 자동 생성)
- [ ] 문서 UI 통합 (Swagger UI, ReDoc)

## 라이선스

MIT License

## 작성자

[작성자 이름]

## 지원

- 이슈: [GitHub Issues](https://github.com/yourusername/jest-swagger/issues)
- 문서: [Documentation](https://github.com/yourusername/jest-swagger/wiki)
