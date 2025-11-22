/**
 * OpenAPI 3.0 타입 정의
 */

/**
 * HTTP 메서드
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

/**
 * 파라미터 위치
 */
export type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';

/**
 * OpenAPI 스키마 타입
 */
export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

/**
 * OpenAPI 스키마 정의
 */
export interface SchemaObject {
  type?: SchemaType;
  format?: string;
  description?: string;
  required?: string[];
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  enum?: unknown[];
  example?: unknown;
  default?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  $ref?: string;
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  // 숫자 검증
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean | number;
  exclusiveMaximum?: boolean | number;
  multipleOf?: number;
  // 문자열 검증
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // 배열 검증
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  // 객체 검증
  minProperties?: number;
  maxProperties?: number;
  additionalProperties?: boolean | SchemaObject;
}

/**
 * OpenAPI 스키마 타입 별칭
 */
export type OpenAPISchema = SchemaObject;

/**
 * 파라미터 정의
 */
export interface ParameterObject {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  schema?: SchemaObject;
  example?: unknown;
}

/**
 * 요청 본문 정의
 */
export interface RequestBodyObject {
  description?: string;
  content: {
    [mediaType: string]: {
      schema: SchemaObject;
      example?: unknown;
    };
  };
  required?: boolean;
}

/**
 * 응답 정의
 */
export interface ResponseObject {
  description: string;
  content?: {
    [mediaType: string]: {
      schema: SchemaObject;
      example?: unknown;
    };
  };
  headers?: Record<string, ParameterObject>;
}

/**
 * 작업(Operation) 정의
 */
export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
  deprecated?: boolean;
  security?: Array<Record<string, string[]>>;
}

/**
 * 경로 항목 정의
 */
export interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  parameters?: ParameterObject[];
}

/**
 * OpenAPI 문서 정의
 */
export interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, PathItemObject>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    responses?: Record<string, ResponseObject>;
    parameters?: Record<string, ParameterObject>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}
