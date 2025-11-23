# jest-swagger 기여 가이드

**한국어** | [English](./CONTRIBUTING.en.md)

jest-swagger 프로젝트에 기여해 주셔서 감사합니다!

## 개발 환경 설정

### 사전 요구사항

- Node.js >= 16.0.0
- npm 또는 yarn
- Git

### 초기 설정

```bash
# 저장소 클론
git clone https://github.com/yourusername/jest-swagger.git
cd jest-swagger

# 의존성 설치
npm install

# 빌드 확인
npm run build

# 테스트 실행
npm test
```

## 개발 워크플로우

### 1. 브랜치 생성

```bash
# 기능 개발
git checkout -b feature/your-feature-name

# 버그 수정
git checkout -b fix/bug-description

# 문서 업데이트
git checkout -b docs/documentation-update
```

### 2. 코드 작성

#### 코드 스타일

- TypeScript strict mode 준수
- ESLint 및 Prettier 규칙 따르기
- 의미 있는 변수명과 함수명 사용
- 복잡한 로직에는 주석 추가

#### 테스트 작성

모든 새로운 기능과 버그 수정에는 테스트가 필요합니다:

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

### 3. 코드 검증

제출하기 전에 다음을 실행하세요:

```bash
# 린트 검사
npm run lint

# 타입 체크
npm run typecheck

# 테스트 실행 (커버리지 포함)
npm run test:coverage

# 코드 포맷팅
npm run format
```

### 4. 커밋

커밋 메시지는 다음 형식을 따릅니다:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 도구 변경

**예시:**

```
feat(decorators): add @ApiParameter decorator

- Add new decorator for API parameter documentation
- Support query, path, header, and cookie parameters
- Include validation and type checking

Closes #123
```

### 5. Pull Request

1. 최신 main 브랜치와 동기화
```bash
git fetch origin
git rebase origin/main
```

2. 변경사항 푸시
```bash
git push origin feature/your-feature-name
```

3. GitHub에서 Pull Request 생성
   - 명확한 제목과 설명 작성
   - 관련 이슈 번호 참조
   - 스크린샷 또는 예제 코드 포함 (필요시)

## 코드 리뷰 프로세스

1. 최소 1명의 승인 필요
2. 모든 CI 체크 통과 필요
3. 코드 커버리지 95% 이상 유지
4. 충돌 해결 및 최신 상태 유지

## 커버리지 요구사항

프로젝트는 다음 커버리지를 유지합니다:

- Branches: 95%
- Functions: 95%
- Lines: 95%
- Statements: 95%

## 문서화

### 코드 문서화

모든 공개 API에는 JSDoc 주석이 필요합니다:

```typescript
/**
 * Swagger 문서를 생성하는 빌더 클래스
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
   * API 정보를 설정합니다
   *
   * @param info - OpenAPI 정보 객체
   * @returns 체이닝을 위한 빌더 인스턴스
   */
  setInfo(info: OpenAPIInfo): this {
    // 구현
  }
}
```

### README 업데이트

새로운 기능을 추가할 때는 README.md를 업데이트하세요.

## 이슈 보고

버그를 발견했거나 기능을 제안하고 싶으신가요?

### 버그 보고

다음 정보를 포함해 주세요:

1. 버그 설명
2. 재현 단계
3. 예상 동작
4. 실제 동작
5. 환경 정보 (Node.js 버전, OS 등)
6. 가능하다면 최소 재현 코드

### 기능 제안

다음 정보를 포함해 주세요:

1. 기능 설명
2. 사용 사례
3. 예상되는 API 디자인
4. 대안 고려사항

## 질문이나 도움이 필요하신가요?

- GitHub Discussions 사용
- 이슈에 'question' 라벨로 등록
- 관련 문서 확인

## 행동 강령

- 존중하고 포용적인 환경 유지
- 건설적인 피드백 제공
- 다양한 관점 존중
- 프로젝트와 커뮤니티의 이익 우선

감사합니다! 🎉
