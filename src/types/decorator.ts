/**
 * 데코레이터 메타데이터 타입 정의
 * Jest 테스트 데코레이터에서 사용되는 메타데이터 타입
 */

import {
  SchemaObject,
  ServerObject,
  SecurityRequirementObject,
  HeaderObject,
  MediaTypeObject,
} from './openapi';

/**
 * HTTP 메서드 타입
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

/**
 * 파라미터 위치 타입
 */
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';

/**
 * Swagger 테스트 메타데이터
 * @SwaggerTest 데코레이터에서 사용
 */
export interface SwaggerTestMetadata {
  /** API 제목 (필수) */
  title: string;

  /** API 버전 (필수) */
  version: string;

  /** API 설명 (선택) */
  description?: string;

  /** 기본 URL (선택) */
  baseUrl?: string;

  /** 태그 목록 (선택) */
  tags?: string[];

  /** 서버 정보 (선택) */
  servers?: ServerObject[];

  /** 보안 요구사항 (선택) */
  security?: SecurityRequirementObject[];

  /** 연락처 정보 (선택) */
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };

  /** 라이선스 정보 (선택) */
  license?: {
    name: string;
    url?: string;
  };

  /** 외부 문서 (선택) */
  externalDocs?: {
    url: string;
    description?: string;
  };
}

/**
 * 경로 메타데이터
 * @ApiEndpoint 데코레이터에서 사용
 */
export interface PathMetadata {
  /** HTTP 메서드 (필수) */
  method: HttpMethod;

  /** API 경로 (필수) */
  path: string;

  /** 작업 요약 (선택) */
  summary?: string;

  /** 작업 설명 (선택) */
  description?: string;

  /** 작업 ID (선택) */
  operationId?: string;

  /** 태그 목록 (선택) */
  tags?: string[];

  /** 사용 중단 여부 (선택) */
  deprecated?: boolean;

  /** 서버 정보 (선택) */
  servers?: ServerObject[];

  /** 외부 문서 (선택) */
  externalDocs?: {
    url: string;
    description?: string;
  };
}

/**
 * 응답 메타데이터
 * @ApiResponse 데코레이터에서 사용
 */
export interface ResponseMetadata {
  /** HTTP 상태 코드 (필수) */
  status: number;

  /** 응답 설명 (필수) */
  description: string;

  /** 응답 스키마 (선택) */
  schema?: SchemaObject;

  /** 응답 헤더 (선택) */
  headers?: Record<string, HeaderObject>;

  /** 응답 예제 (선택) */
  example?: unknown;

  /** 여러 예제 (선택) */
  examples?: Record<string, unknown>;

  /** Content-Type (선택, 기본값: application/json) */
  contentType?: string;
}

/**
 * 파라미터 메타데이터
 * @ApiParameter 데코레이터에서 사용
 */
export interface ParameterMetadata {
  /** 파라미터 이름 (필수) */
  name: string;

  /** 파라미터 위치 (필수) */
  in: ParameterLocation;

  /** 파라미터 설명 (선택) */
  description?: string;

  /** 필수 여부 (선택) */
  required?: boolean;

  /** 사용 중단 여부 (선택) */
  deprecated?: boolean;

  /** 스키마 (선택) */
  schema?: SchemaObject;

  /** 예제 (선택) */
  example?: unknown;

  /** 여러 예제 (선택) */
  examples?: Record<string, unknown>;

  /** 빈 값 허용 여부 (선택) */
  allowEmptyValue?: boolean;
}

/**
 * 요청 본문 메타데이터
 * @ApiRequestBody 데코레이터에서 사용
 */
export interface RequestBodyMetadata {
  /** 요청 본문 설명 (선택) */
  description?: string;

  /** 콘텐츠 정의 (필수) */
  content: Record<string, MediaTypeObject>;

  /** 필수 여부 (선택) */
  required?: boolean;
}

/**
 * 보안 메타데이터
 * @ApiSecurity 데코레이터에서 사용
 */
export type SecurityMetadata =
  | ApiKeySecurityMetadata
  | HttpSecurityMetadata
  | OAuth2SecurityMetadata
  | OpenIdConnectSecurityMetadata;

/**
 * API Key 보안 메타데이터
 */
export interface ApiKeySecurityMetadata {
  type: 'apiKey';
  name: string;
  in: 'query' | 'header' | 'cookie';
  description?: string;
}

/**
 * HTTP 보안 메타데이터
 */
export interface HttpSecurityMetadata {
  type: 'http';
  scheme: string;
  bearerFormat?: string;
  description?: string;
}

/**
 * OAuth2 보안 메타데이터
 */
export interface OAuth2SecurityMetadata {
  type: 'oauth2';
  flows?: {
    implicit?: OAuth2FlowMetadata;
    password?: OAuth2FlowMetadata;
    clientCredentials?: OAuth2FlowMetadata;
    authorizationCode?: OAuth2FlowMetadata;
  };
  description?: string;
}

/**
 * OAuth2 플로우 메타데이터
 */
export interface OAuth2FlowMetadata {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

/**
 * OpenID Connect 보안 메타데이터
 */
export interface OpenIdConnectSecurityMetadata {
  type: 'openIdConnect';
  openIdConnectUrl: string;
  description?: string;
}

/**
 * 완전한 API 메타데이터
 * 모든 데코레이터 메타데이터를 조합한 타입
 */
export interface ApiMetadata {
  /** 경로 메타데이터 (필수) */
  path: PathMetadata;

  /** 파라미터 메타데이터 (선택) */
  parameters?: ParameterMetadata[];

  /** 요청 본문 메타데이터 (선택) */
  requestBody?: RequestBodyMetadata;

  /** 응답 메타데이터 (필수) */
  responses: ResponseMetadata[];

  /** 보안 메타데이터 (선택) */
  security?: SecurityMetadata[];

  /** 태그 (선택) */
  tags?: string[];

  /** 콜백 (선택) */
  callbacks?: Record<string, unknown>;
}

/**
 * 메타데이터 키
 * Reflect API를 사용하여 메타데이터를 저장/조회하는데 사용되는 키
 */
export const METADATA_KEYS = {
  /** Swagger 테스트 메타데이터 키 */
  SWAGGER_TEST: 'swagger:test',

  /** 경로 메타데이터 키 */
  PATH: 'swagger:path',

  /** 파라미터 메타데이터 키 */
  PARAMETERS: 'swagger:parameters',

  /** 요청 본문 메타데이터 키 */
  REQUEST_BODY: 'swagger:requestBody',

  /** 응답 메타데이터 키 */
  RESPONSES: 'swagger:responses',

  /** 보안 메타데이터 키 */
  SECURITY: 'swagger:security',

  /** 태그 메타데이터 키 */
  TAGS: 'swagger:tags',
} as const;

/**
 * 메타데이터 키 타입
 */
export type MetadataKey = (typeof METADATA_KEYS)[keyof typeof METADATA_KEYS];

/**
 * 데코레이터 옵션 기본 인터페이스
 */
export interface DecoratorOptions {
  /** 메타데이터를 병합할지 여부 (기본값: false) */
  merge?: boolean;

  /** 메타데이터를 상속받을지 여부 (기본값: true) */
  inherit?: boolean;
}

/**
 * 메타데이터 스토어 인터페이스
 * 메타데이터를 저장하고 조회하는 인터페이스
 */
export interface MetadataStore {
  /**
   * 메타데이터 설정
   */
  set<T>(key: MetadataKey, target: object, value: T): void;

  /**
   * 메타데이터 조회
   */
  get<T>(key: MetadataKey, target: object): T | undefined;

  /**
   * 메타데이터 존재 여부 확인
   */
  has(key: MetadataKey, target: object): boolean;

  /**
   * 메타데이터 삭제
   */
  delete(key: MetadataKey, target: object): boolean;

  /**
   * 모든 메타데이터 조회
   */
  getAll(target: object): Map<MetadataKey, unknown>;

  /**
   * 모든 메타데이터 삭제
   */
  clear(target: object): void;
}

/**
 * 스키마 빌더 옵션
 * 스키마를 자동으로 생성할 때 사용되는 옵션
 */
export interface SchemaBuilderOptions {
  /** TypeScript 타입에서 스키마 자동 생성 여부 */
  autoGenerate?: boolean;

  /** 추가 속성 허용 여부 */
  additionalProperties?: boolean;

  /** 예제 생성 여부 */
  generateExamples?: boolean;

  /** 설명 생성 여부 */
  generateDescriptions?: boolean;

  /** 필수 필드 추론 여부 */
  inferRequired?: boolean;
}

/**
 * 검증 옵션
 * 메타데이터 검증 시 사용되는 옵션
 */
export interface ValidationOptions {
  /** 엄격한 검증 여부 */
  strict?: boolean;

  /** 경고 출력 여부 */
  warnings?: boolean;

  /** OpenAPI 스펙 버전 */
  openapiVersion?: '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3' | '3.1.0';

  /** 사용자 정의 검증 규칙 */
  customValidators?: Array<(metadata: unknown) => string[]>;
}
