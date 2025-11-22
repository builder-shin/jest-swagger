/**
 * OpenAPI 3.0 타입 정의
 * OpenAPI Specification 3.0.0을 기반으로 한 TypeScript 타입 정의
 *
 * @see https://spec.openapis.org/oas/v3.0.0
 */

/**
 * OpenAPI 문서의 최상위 객체
 */
export interface OpenAPIDocument {
  /** OpenAPI 스펙 버전 (예: "3.0.0") */
  openapi: string;

  /** API 메타데이터 */
  info: InfoObject;

  /** API 엔드포인트 경로 정의 */
  paths: PathsObject;

  /** 서버 정보 (선택) */
  servers?: ServerObject[];

  /** 재사용 가능한 컴포넌트 (선택) */
  components?: ComponentsObject;

  /** 보안 요구사항 (선택) */
  security?: SecurityRequirementObject[];

  /** 태그 정의 (선택) */
  tags?: TagObject[];

  /** 외부 문서 (선택) */
  externalDocs?: ExternalDocumentationObject;
}

/**
 * API 메타데이터
 */
export interface InfoObject {
  /** API 제목 (필수) */
  title: string;

  /** API 버전 (필수) */
  version: string;

  /** API 설명 (선택) */
  description?: string;

  /** 서비스 약관 URL (선택) */
  termsOfService?: string;

  /** 연락처 정보 (선택) */
  contact?: ContactObject;

  /** 라이선스 정보 (선택) */
  license?: LicenseObject;
}

/**
 * 연락처 정보
 */
export interface ContactObject {
  /** 담당자 이름 */
  name?: string;

  /** 연락처 URL */
  url?: string;

  /** 이메일 주소 */
  email?: string;
}

/**
 * 라이선스 정보
 */
export interface LicenseObject {
  /** 라이선스 이름 (필수) */
  name: string;

  /** 라이선스 URL (선택) */
  url?: string;
}

/**
 * 서버 정보
 */
export interface ServerObject {
  /** 서버 URL (필수) */
  url: string;

  /** 서버 설명 (선택) */
  description?: string;

  /** 서버 변수 (선택) */
  variables?: Record<string, ServerVariableObject>;
}

/**
 * 서버 변수
 */
export interface ServerVariableObject {
  /** 기본값 (필수) */
  default: string;

  /** 가능한 값들 (선택) */
  enum?: string[];

  /** 설명 (선택) */
  description?: string;
}

/**
 * API 경로 정의
 */
export interface PathsObject {
  /** 경로별 작업 정의 */
  [path: string]: PathItemObject;
}

/**
 * 단일 경로 항목
 */
export interface PathItemObject {
  /** 참조 (선택) */
  $ref?: string;

  /** 요약 (선택) */
  summary?: string;

  /** 설명 (선택) */
  description?: string;

  /** GET 작업 */
  get?: OperationObject;

  /** PUT 작업 */
  put?: OperationObject;

  /** POST 작업 */
  post?: OperationObject;

  /** DELETE 작업 */
  delete?: OperationObject;

  /** OPTIONS 작업 */
  options?: OperationObject;

  /** HEAD 작업 */
  head?: OperationObject;

  /** PATCH 작업 */
  patch?: OperationObject;

  /** TRACE 작업 */
  trace?: OperationObject;

  /** 서버 정보 (선택) */
  servers?: ServerObject[];

  /** 공통 파라미터 (선택) */
  parameters?: ParameterObject[];
}

/**
 * API 작업 정의
 */
export interface OperationObject {
  /** 작업 태그 */
  tags?: string[];

  /** 작업 요약 */
  summary?: string;

  /** 작업 설명 */
  description?: string;

  /** 외부 문서 */
  externalDocs?: ExternalDocumentationObject;

  /** 작업 ID (고유) */
  operationId?: string;

  /** 파라미터 */
  parameters?: ParameterObject[];

  /** 요청 본문 */
  requestBody?: RequestBodyObject;

  /** 응답 정의 (필수) */
  responses: ResponsesObject;

  /** 콜백 */
  callbacks?: Record<string, CallbackObject>;

  /** 사용 중단 여부 */
  deprecated?: boolean;

  /** 보안 요구사항 */
  security?: SecurityRequirementObject[];

  /** 서버 정보 */
  servers?: ServerObject[];
}

/**
 * 파라미터 정의
 */
export interface ParameterObject {
  /** 파라미터 이름 (필수) */
  name: string;

  /** 파라미터 위치 (필수) */
  in: 'query' | 'header' | 'path' | 'cookie';

  /** 설명 */
  description?: string;

  /** 필수 여부 (path의 경우 true) */
  required?: boolean;

  /** 사용 중단 여부 */
  deprecated?: boolean;

  /** 빈 값 허용 여부 */
  allowEmptyValue?: boolean;

  /** 스키마 */
  schema?: SchemaObject;

  /** 예제 */
  example?: unknown;

  /** 여러 예제 */
  examples?: Record<string, ExampleObject>;
}

/**
 * 요청 본문 정의
 */
export interface RequestBodyObject {
  /** 설명 */
  description?: string;

  /** 콘텐츠 정의 (필수) */
  content: Record<string, MediaTypeObject>;

  /** 필수 여부 */
  required?: boolean;
}

/**
 * 미디어 타입 정의
 */
export interface MediaTypeObject {
  /** 스키마 */
  schema?: SchemaObject;

  /** 예제 */
  example?: unknown;

  /** 여러 예제 */
  examples?: Record<string, ExampleObject>;

  /** 인코딩 정보 */
  encoding?: Record<string, EncodingObject>;
}

/**
 * 인코딩 정보
 */
export interface EncodingObject {
  /** Content-Type */
  contentType?: string;

  /** 헤더 */
  headers?: Record<string, HeaderObject>;

  /** 스타일 */
  style?: string;

  /** Explode 여부 */
  explode?: boolean;

  /** 예약 문자 허용 여부 */
  allowReserved?: boolean;
}

/**
 * 응답 정의 모음
 */
export interface ResponsesObject {
  /** HTTP 상태 코드별 응답 */
  [statusCode: string]: ResponseObject | undefined;
}

/**
 * 단일 응답 정의
 */
export interface ResponseObject {
  /** 응답 설명 (필수) */
  description: string;

  /** 헤더 */
  headers?: Record<string, HeaderObject>;

  /** 콘텐츠 */
  content?: Record<string, MediaTypeObject>;

  /** 링크 */
  links?: Record<string, LinkObject>;
}

/**
 * 헤더 정의 (ParameterObject와 유사하지만 in 필드 없음)
 */
export interface HeaderObject {
  /** 설명 */
  description?: string;

  /** 필수 여부 */
  required?: boolean;

  /** 사용 중단 여부 */
  deprecated?: boolean;

  /** 스키마 */
  schema?: SchemaObject;

  /** 예제 */
  example?: unknown;

  /** 여러 예제 */
  examples?: Record<string, ExampleObject>;
}

/**
 * 스키마 정의 (JSON Schema Draft 7 기반)
 */
export interface SchemaObject {
  /** 참조 */
  $ref?: string;

  /** 타입 */
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';

  /** 포맷 (예: date, email, uuid) */
  format?: string;

  /** 제목 */
  title?: string;

  /** 설명 */
  description?: string;

  /** 기본값 */
  default?: unknown;

  /** nullable 여부 */
  nullable?: boolean;

  /** 읽기 전용 */
  readOnly?: boolean;

  /** 쓰기 전용 */
  writeOnly?: boolean;

  /** 예제 */
  example?: unknown;

  /** 사용 중단 여부 */
  deprecated?: boolean;

  // 숫자 검증
  /** 최소값 */
  minimum?: number;

  /** 최대값 */
  maximum?: number;

  /** 배타적 최소값 */
  exclusiveMinimum?: boolean | number;

  /** 배타적 최대값 */
  exclusiveMaximum?: boolean | number;

  /** 배수 */
  multipleOf?: number;

  // 문자열 검증
  /** 최소 길이 */
  minLength?: number;

  /** 최대 길이 */
  maxLength?: number;

  /** 패턴 (정규식) */
  pattern?: string;

  // 배열 검증
  /** 배열 항목 스키마 */
  items?: SchemaObject;

  /** 최소 항목 수 */
  minItems?: number;

  /** 최대 항목 수 */
  maxItems?: number;

  /** 고유 항목 여부 */
  uniqueItems?: boolean;

  // 객체 검증
  /** 속성 정의 */
  properties?: Record<string, SchemaObject>;

  /** 필수 속성 */
  required?: string[];

  /** 추가 속성 허용 여부 또는 스키마 */
  additionalProperties?: boolean | SchemaObject;

  /** 최소 속성 수 */
  minProperties?: number;

  /** 최대 속성 수 */
  maxProperties?: number;

  // 조합 스키마
  /** 모든 스키마 만족 */
  allOf?: SchemaObject[];

  /** 하나 이상의 스키마 만족 */
  anyOf?: SchemaObject[];

  /** 정확히 하나의 스키마 만족 */
  oneOf?: SchemaObject[];

  /** 스키마 부정 */
  not?: SchemaObject;

  // 열거형
  /** 허용되는 값들 */
  enum?: unknown[];

  // Discriminator
  /** 다형성 구분자 */
  discriminator?: DiscriminatorObject;

  // XML
  /** XML 메타데이터 */
  xml?: XMLObject;

  // 외부 문서
  /** 외부 문서 */
  externalDocs?: ExternalDocumentationObject;
}

/**
 * 다형성 구분자
 */
export interface DiscriminatorObject {
  /** 속성 이름 (필수) */
  propertyName: string;

  /** 매핑 */
  mapping?: Record<string, string>;
}

/**
 * XML 메타데이터
 */
export interface XMLObject {
  /** 이름 */
  name?: string;

  /** 네임스페이스 */
  namespace?: string;

  /** 접두사 */
  prefix?: string;

  /** 속성 여부 */
  attribute?: boolean;

  /** 래핑 여부 */
  wrapped?: boolean;
}

/**
 * 예제 정의
 */
export interface ExampleObject {
  /** 요약 */
  summary?: string;

  /** 설명 */
  description?: string;

  /** 값 */
  value?: unknown;

  /** 외부 값 URL */
  externalValue?: string;
}

/**
 * 링크 정의
 */
export interface LinkObject {
  /** 작업 참조 */
  operationRef?: string;

  /** 작업 ID */
  operationId?: string;

  /** 파라미터 */
  parameters?: Record<string, unknown>;

  /** 요청 본문 */
  requestBody?: unknown;

  /** 설명 */
  description?: string;

  /** 서버 */
  server?: ServerObject;
}

/**
 * 콜백 정의
 */
export interface CallbackObject {
  /** 표현식별 경로 항목 */
  [expression: string]: PathItemObject;
}

/**
 * 재사용 가능한 컴포넌트
 */
export interface ComponentsObject {
  /** 스키마 */
  schemas?: Record<string, SchemaObject>;

  /** 응답 */
  responses?: Record<string, ResponseObject>;

  /** 파라미터 */
  parameters?: Record<string, ParameterObject>;

  /** 예제 */
  examples?: Record<string, ExampleObject>;

  /** 요청 본문 */
  requestBodies?: Record<string, RequestBodyObject>;

  /** 헤더 */
  headers?: Record<string, HeaderObject>;

  /** 보안 스키마 */
  securitySchemes?: Record<string, SecuritySchemeObject>;

  /** 링크 */
  links?: Record<string, LinkObject>;

  /** 콜백 */
  callbacks?: Record<string, CallbackObject>;
}

/**
 * 보안 스키마 정의
 */
export type SecuritySchemeObject =
  | ApiKeySecurityScheme
  | HttpSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme;

/**
 * API Key 인증
 */
export interface ApiKeySecurityScheme {
  type: 'apiKey';
  name: string;
  in: 'query' | 'header' | 'cookie';
  description?: string;
}

/**
 * HTTP 인증
 */
export interface HttpSecurityScheme {
  type: 'http';
  scheme: string;
  bearerFormat?: string;
  description?: string;
}

/**
 * OAuth2 인증
 */
export interface OAuth2SecurityScheme {
  type: 'oauth2';
  flows: OAuthFlowsObject;
  description?: string;
}

/**
 * OpenID Connect 인증
 */
export interface OpenIdConnectSecurityScheme {
  type: 'openIdConnect';
  openIdConnectUrl: string;
  description?: string;
}

/**
 * OAuth 플로우
 */
export interface OAuthFlowsObject {
  /** Implicit 플로우 */
  implicit?: OAuthFlowObject;

  /** Password 플로우 */
  password?: OAuthFlowObject;

  /** Client Credentials 플로우 */
  clientCredentials?: OAuthFlowObject;

  /** Authorization Code 플로우 */
  authorizationCode?: OAuthFlowObject;
}

/**
 * OAuth 플로우 정의
 */
export interface OAuthFlowObject {
  /** 인증 URL */
  authorizationUrl?: string;

  /** 토큰 URL */
  tokenUrl?: string;

  /** 갱신 URL */
  refreshUrl?: string;

  /** 스코프 (필수) */
  scopes: Record<string, string>;
}

/**
 * 보안 요구사항
 */
export interface SecurityRequirementObject {
  /** 보안 스키마별 스코프 */
  [name: string]: string[];
}

/**
 * 태그 정의
 */
export interface TagObject {
  /** 태그 이름 (필수) */
  name: string;

  /** 설명 */
  description?: string;

  /** 외부 문서 */
  externalDocs?: ExternalDocumentationObject;
}

/**
 * 외부 문서
 */
export interface ExternalDocumentationObject {
  /** URL (필수) */
  url: string;

  /** 설명 */
  description?: string;
}

/**
 * HTTP 메서드 타입
 */
export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/**
 * HTTP 상태 코드 타입
 */
export type HttpStatusCode =
  | '200'
  | '201'
  | '202'
  | '203'
  | '204'
  | '205'
  | '206'
  | '300'
  | '301'
  | '302'
  | '303'
  | '304'
  | '305'
  | '307'
  | '308'
  | '400'
  | '401'
  | '402'
  | '403'
  | '404'
  | '405'
  | '406'
  | '407'
  | '408'
  | '409'
  | '410'
  | '411'
  | '412'
  | '413'
  | '414'
  | '415'
  | '416'
  | '417'
  | '418'
  | '500'
  | '501'
  | '502'
  | '503'
  | '504'
  | '505'
  | 'default'
  | string;
