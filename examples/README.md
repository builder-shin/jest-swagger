# jest-swagger 예제

이 디렉토리에는 jest-swagger의 다양한 사용 예제가 포함되어 있습니다.

## 예제 목록

### 1. 기본 사용법 (basic-usage)

가장 기본적인 jest-swagger 사용법을 보여줍니다.

- 간단한 CRUD API 테스트
- 데코레이터 사용법
- 파라미터와 응답 정의

**파일:** `basic-usage/user-api.test.ts`

**실행:**
```bash
npm test -- examples/basic-usage
```

### 2. 타입 생성 (type-generation)

OpenAPI 문서에서 TypeScript 타입을 자동 생성하는 방법을 보여줍니다.

- TypeGenerator 사용법
- 타입 정의 생성
- 생성된 타입 활용

**파일:** `type-generation/generate-types.ts`

**실행:**
```bash
npx ts-node examples/type-generation/generate-types.ts
```

**생성된 파일:** `type-generation/api.generated.ts`

### 3. Express 통합 (express-integration)

Express 앱과 jest-swagger를 통합하는 방법을 보여줍니다.

- Swagger UI 설정
- API 라우트 연동
- 실시간 문서 업데이트

**파일:** `express-integration/app.ts`

**실행:**
```bash
npm run example:express
```

**Swagger UI:** http://localhost:3000/api-docs

### 4. 복잡한 API (complex-api)

실제 프로덕션 환경에서 사용할 수 있는 복잡한 API 예제입니다.

- 인증 및 권한 부여
- 중첩된 객체 구조
- 파일 업로드
- 에러 처리

**파일:** `complex-api/api.test.ts`

## 모든 예제 실행

```bash
# 모든 테스트 실행
npm test -- examples/

# 특정 예제만 실행
npm test -- examples/basic-usage/
npm test -- examples/complex-api/
```

## 생성된 문서 확인

각 예제를 실행하면 다음 위치에 OpenAPI 문서가 생성됩니다:

- `examples/basic-usage/swagger.yaml`
- `examples/type-generation/swagger.yaml`
- `examples/express-integration/swagger.yaml`
- `examples/complex-api/swagger.yaml`

## 타입 생성

각 예제에서 타입을 생성하려면:

```bash
npm run generate-types
```

생성된 타입은 `types/api.generated.ts` 파일에 저장됩니다.

## 추가 리소스

- [API 문서](../docs/API.md)
- [튜토리얼](../docs/TUTORIAL.md)
- [마이그레이션 가이드](../docs/MIGRATION.md)
