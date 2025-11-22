/**
 * 데코레이터 메타데이터 타입 정의
 */

import { HttpMethod, ParameterObject, SchemaObject } from './openapi.types';

/**
 * 경로 메타데이터
 */
export interface PathMetadata {
  path: string;
  basePath?: string;
}

/**
 * API 메타데이터
 */
export interface ApiMetadata {
  method: HttpMethod;
  path?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
}

/**
 * 응답 메타데이터
 */
export interface ResponseMetadata {
  statusCode: number;
  description: string;
  schema?: SchemaObject;
  mediaType?: string;
}

/**
 * 파라미터 메타데이터
 */
export interface ParameterMetadata extends ParameterObject {
  propertyKey: string;
  parameterIndex: number;
}

/**
 * 요청 본문 메타데이터
 */
export interface RequestBodyMetadata {
  description?: string;
  schema?: SchemaObject;
  required?: boolean;
  mediaType?: string;
}

/**
 * 메타데이터 키
 */
export const METADATA_KEYS = {
  PATH: 'swagger:path',
  API: 'swagger:api',
  RESPONSES: 'swagger:responses',
  PARAMETERS: 'swagger:parameters',
  REQUEST_BODY: 'swagger:requestBody',
} as const;

/**
 * 메타데이터 저장소 인터페이스
 */
export interface MetadataStorage {
  paths: Map<object, PathMetadata>;
  apis: Map<object, Map<string | symbol, ApiMetadata>>;
  responses: Map<object, Map<string | symbol, ResponseMetadata[]>>;
  parameters: Map<object, Map<string | symbol, ParameterMetadata[]>>;
  requestBodies: Map<object, Map<string | symbol, RequestBodyMetadata>>;
}

/**
 * 클래스 생성자 타입
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * 메서드 데코레이터 타입
 */
export type MethodDecorator = (
  target: object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => PropertyDescriptor | void;

/**
 * 클래스 데코레이터 타입
 */
export type ClassDecorator = <T extends Constructor>(target: T) => T | void;

/**
 * 파라미터 데코레이터 타입
 */
export type ParameterDecorator = (
  target: object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number
) => void;
