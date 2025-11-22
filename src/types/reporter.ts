/**
 * Reporter 타입 정의
 * OpenAPI 문서 생성 및 출력 관련 타입
 */

import { OpenAPIDocument } from './openapi';

/**
 * 출력 포맷 타입
 */
export type OutputFormat = 'json' | 'yaml' | 'yml';

/**
 * 로그 레벨
 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Reporter 옵션
 */
export interface ReporterOptions {
  /** 출력 디렉토리 (기본값: './docs') */
  outputDir?: string;

  /** 출력 파일명 (기본값: 'openapi') */
  filename?: string;

  /** 출력 포맷 (기본값: 'yaml') */
  format?: OutputFormat;

  /** 여러 포맷으로 동시 출력 여부 */
  multiFormat?: boolean;

  /** 파일 덮어쓰기 여부 (기본값: true) */
  overwrite?: boolean;

  /** Pretty print 여부 (기본값: true) */
  pretty?: boolean;

  /** JSON 들여쓰기 크기 (기본값: 2) */
  indent?: number;

  /** 로그 레벨 (기본값: 'info') */
  logLevel?: LogLevel;

  /** 검증 활성화 여부 (기본값: true) */
  validate?: boolean;

  /** 엄격한 검증 여부 (기본값: false) */
  strictValidation?: boolean;

  /** 생성된 파일 경로 출력 여부 (기본값: true) */
  printPath?: boolean;

  /** 통계 정보 출력 여부 (기본값: false) */
  printStats?: boolean;

  /** 메타데이터 수집 여부 (기본값: true) */
  collectMetadata?: boolean;

  /** 문서 병합 여부 (기본값: false) */
  merge?: boolean;

  /** 병합할 기존 문서 경로 */
  mergeSource?: string;

  /** 사용자 정의 변환기 */
  transformers?: DocumentTransformer[];

  /** 출력 후 콜백 */
  onComplete?: (result: ReporterResult) => void | Promise<void>;

  /** 에러 발생 시 콜백 */
  onError?: (error: Error) => void | Promise<void>;

  /** 테스트 완료 후에만 생성 여부 (기본값: true) */
  onlyAfterAllTests?: boolean;

  /** 실패한 테스트 포함 여부 (기본값: false) */
  includeFailedTests?: boolean;

  /** 스킵된 테스트 포함 여부 (기본값: false) */
  includeSkippedTests?: boolean;

  /** 테스트 메타데이터 포함 여부 (기본값: false) */
  includeTestMetadata?: boolean;

  /** Jest 컨텍스트 접근 */
  jestContext?: JestContext;
}

/**
 * 문서 변환기 인터페이스
 */
export interface DocumentTransformer {
  /** 변환기 이름 */
  name: string;

  /** 변환 함수 */
  transform: (document: OpenAPIDocument) => OpenAPIDocument | Promise<OpenAPIDocument>;

  /** 변환 순서 (낮을수록 먼저 실행, 기본값: 100) */
  order?: number;
}

/**
 * Reporter 결과
 */
export interface ReporterResult {
  /** 성공 여부 */
  success: boolean;

  /** 생성된 파일 경로 목록 */
  outputPaths: string[];

  /** 생성된 문서 */
  document: OpenAPIDocument;

  /** 통계 정보 */
  stats: DocumentStats;

  /** 검증 결과 */
  validation?: ValidationResult;

  /** 에러 (실패 시) */
  error?: Error;

  /** 실행 시간 (ms) */
  executionTime: number;
}

/**
 * 문서 통계 정보
 */
export interface DocumentStats {
  /** 전체 경로 수 */
  totalPaths: number;

  /** 전체 작업 수 */
  totalOperations: number;

  /** HTTP 메서드별 작업 수 */
  operationsByMethod: Record<string, number>;

  /** 전체 스키마 수 */
  totalSchemas: number;

  /** 전체 응답 수 */
  totalResponses: number;

  /** 전체 파라미터 수 */
  totalParameters: number;

  /** 전체 태그 수 */
  totalTags: number;

  /** 보안 스키마 수 */
  totalSecuritySchemes: number;

  /** 문서 크기 (bytes) */
  documentSize: number;
}

/**
 * 검증 결과
 */
export interface ValidationResult {
  /** 유효 여부 */
  valid: boolean;

  /** 에러 목록 */
  errors: ValidationError[];

  /** 경고 목록 */
  warnings: ValidationWarning[];

  /** 검증된 스펙 버전 */
  specVersion: string;
}

/**
 * 검증 에러
 */
export interface ValidationError {
  /** 에러 코드 */
  code: string;

  /** 에러 메시지 */
  message: string;

  /** 에러 경로 (JSON Pointer) */
  path?: string;

  /** 심각도 */
  severity: 'error';

  /** 추가 정보 */
  details?: Record<string, unknown>;
}

/**
 * 검증 경고
 */
export interface ValidationWarning {
  /** 경고 코드 */
  code: string;

  /** 경고 메시지 */
  message: string;

  /** 경고 경로 (JSON Pointer) */
  path?: string;

  /** 심각도 */
  severity: 'warning';

  /** 추가 정보 */
  details?: Record<string, unknown>;
}

/**
 * Jest Reporter 옵션
 * Jest Custom Reporter로 사용될 때의 옵션
 */
export interface JestReporterOptions extends ReporterOptions {
  /** 테스트 완료 후에만 생성 여부 (기본값: true) */
  onlyAfterAllTests?: boolean;

  /** 실패한 테스트 포함 여부 (기본값: false) */
  includeFailedTests?: boolean;

  /** 스킵된 테스트 포함 여부 (기본값: false) */
  includeSkippedTests?: boolean;

  /** 테스트 메타데이터 포함 여부 (기본값: false) */
  includeTestMetadata?: boolean;

  /** Jest 컨텍스트 접근 */
  jestContext?: JestContext;
}

/**
 * Jest 컨텍스트
 */
export interface JestContext {
  /** 테스트 결과 */
  testResults?: TestResults;

  /** 전역 설정 */
  globalConfig?: GlobalConfig;

  /** 프로젝트 설정 */
  projectConfigs?: ProjectConfig[];
}

/**
 * 테스트 결과
 */
export interface TestResults {
  /** 성공 여부 */
  success: boolean;

  /** 전체 테스트 수 */
  numTotalTests: number;

  /** 통과한 테스트 수 */
  numPassedTests: number;

  /** 실패한 테스트 수 */
  numFailedTests: number;

  /** 스킵된 테스트 수 */
  numPendingTests: number;

  /** 실행 시간 (ms) */
  startTime: number;

  /** 테스트 파일별 결과 */
  testResults: TestFileResult[];
}

/**
 * 테스트 파일 결과
 */
export interface TestFileResult {
  /** 테스트 파일 경로 */
  testFilePath: string;

  /** 테스트 결과 */
  testResults: TestCaseResult[];

  /** 실행 시간 (ms) */
  perfStats: {
    start: number;
    end: number;
  };
}

/**
 * 테스트 케이스 결과
 */
export interface TestCaseResult {
  /** 테스트 이름 */
  title: string;

  /** 전체 이름 (describe + it) */
  fullName: string;

  /** 상태 */
  status: 'passed' | 'failed' | 'pending' | 'skipped';

  /** 실행 시간 (ms) */
  duration?: number;

  /** 에러 메시지 (실패 시) */
  failureMessages?: string[];
}

/**
 * Jest 전역 설정
 */
export interface GlobalConfig {
  /** 루트 디렉토리 */
  rootDir: string;

  /** Watch 모드 여부 */
  watch: boolean;

  /** 커버리지 수집 여부 */
  collectCoverage: boolean;
}

/**
 * Jest 프로젝트 설정
 */
export interface ProjectConfig {
  /** 루트 디렉토리 */
  rootDir: string;

  /** 테스트 매치 패턴 */
  testMatch: string[];

  /** 표시 이름 */
  displayName?: string;
}

/**
 * 파일 라이터 옵션
 */
export interface FileWriterOptions {
  /** 파일 경로 */
  path: string;

  /** 파일 내용 */
  content: string;

  /** 인코딩 (기본값: 'utf-8') */
  encoding?: BufferEncoding;

  /** 덮어쓰기 여부 (기본값: true) */
  overwrite?: boolean;

  /** 디렉토리 자동 생성 여부 (기본값: true) */
  createDir?: boolean;

  /** 파일 권한 모드 */
  mode?: number;
}

/**
 * 문서 빌더 옵션
 */
export interface DocumentBuilderOptions {
  /** 기본 정보 */
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };

  /** 서버 정보 */
  servers?: Array<{
    url: string;
    description?: string;
  }>;

  /** 기본 태그 */
  tags?: string[];

  /** 보안 스키마 */
  securitySchemes?: Record<string, unknown>;

  /** 기본 보안 요구사항 */
  security?: Array<Record<string, string[]>>;

  /** 외부 문서 */
  externalDocs?: {
    url: string;
    description?: string;
  };

  /** OpenAPI 버전 (기본값: '3.0.0') */
  openapiVersion?: string;
}

/**
 * 문서 생성기 인터페이스
 */
export interface DocumentGenerator {
  /**
   * 문서 생성
   */
  generate(): OpenAPIDocument | Promise<OpenAPIDocument>;

  /**
   * 메타데이터 수집
   */
  collectMetadata?(): void | Promise<void>;

  /**
   * 문서 검증
   */
  validate?(document: OpenAPIDocument): ValidationResult | Promise<ValidationResult>;

  /**
   * 문서 변환
   */
  transform?(document: OpenAPIDocument): OpenAPIDocument | Promise<OpenAPIDocument>;
}

/**
 * 포맷터 인터페이스
 */
export interface Formatter {
  /**
   * 문서를 문자열로 변환
   */
  format(document: OpenAPIDocument): string | Promise<string>;

  /**
   * 문자열을 문서로 파싱
   */
  parse?(content: string): OpenAPIDocument | Promise<OpenAPIDocument>;

  /**
   * 포맷 검증
   */
  validate?(content: string): boolean | Promise<boolean>;
}

/**
 * JSON 포맷터 옵션
 */
export interface JsonFormatterOptions {
  /** 들여쓰기 크기 (기본값: 2) */
  indent?: number;

  /** Pretty print 여부 (기본값: true) */
  pretty?: boolean;

  /** 정렬 여부 (기본값: false) */
  sort?: boolean;

  /** replacer 함수 */
  replacer?: (key: string, value: unknown) => unknown;
}

/**
 * YAML 포맷터 옵션
 */
export interface YamlFormatterOptions {
  /** 들여쓰기 크기 (기본값: 2) */
  indent?: number;

  /** 줄 너비 (기본값: 80) */
  lineWidth?: number;

  /** 주석 포함 여부 (기본값: false) */
  includeComments?: boolean;

  /** 정렬 여부 (기본값: false) */
  sortKeys?: boolean;

  /** 흐름 스타일 사용 여부 (기본값: false) */
  flowLevel?: number;
}

/**
 * 진행 상황 리포터 인터페이스
 */
export interface ProgressReporter {
  /**
   * 시작
   */
  start(message: string): void;

  /**
   * 진행 중
   */
  progress(current: number, total: number, message?: string): void;

  /**
   * 완료
   */
  complete(message?: string): void;

  /**
   * 에러
   */
  error(error: Error): void;
}

/**
 * 캐시 옵션
 */
export interface CacheOptions {
  /** 캐시 활성화 여부 (기본값: false) */
  enabled?: boolean;

  /** 캐시 디렉토리 */
  dir?: string;

  /** 캐시 TTL (ms) */
  ttl?: number;

  /** 캐시 키 생성 함수 */
  keyGenerator?: (options: ReporterOptions) => string;
}

/**
 * 병합 전략
 */
export type MergeStrategy = 'overwrite' | 'merge' | 'append' | 'skip';

/**
 * 병합 옵션
 */
export interface MergeOptions {
  /** 경로 병합 전략 */
  paths?: MergeStrategy;

  /** 스키마 병합 전략 */
  schemas?: MergeStrategy;

  /** 응답 병합 전략 */
  responses?: MergeStrategy;

  /** 파라미터 병합 전략 */
  parameters?: MergeStrategy;

  /** 보안 스키마 병합 전략 */
  securitySchemes?: MergeStrategy;

  /** 충돌 해결 콜백 */
  onConflict?: (key: string, source: unknown, target: unknown) => unknown;
}
