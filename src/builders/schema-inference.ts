/**
 * 스키마 추론 모듈
 *
 * 런타임 데이터에서 JSON Schema를 자동으로 추론
 */

import { SchemaObject } from '../types/openapi.types';

/**
 * 스키마 추론 옵션
 */
export interface InferSchemaOptions {
  /**
   * 정수 타입을 별도로 추론할지 여부
   */
  inferInteger?: boolean;

  /**
   * 문자열 형식(이메일, URL 등)을 감지할지 여부
   */
  detectFormat?: boolean;
}

/**
 * 런타임 값에서 OpenAPI 스키마를 추론
 *
 * @param value - 추론할 값
 * @param options - 추론 옵션
 * @returns 추론된 스키마
 */
export function inferSchema(value: unknown, options: InferSchemaOptions = {}): SchemaObject {
  // null 처리
  if (value === null) {
    return {
      type: 'string',
      nullable: true,
    };
  }

  // 타입 확인
  const type = typeof value;

  // 기본 타입 처리
  if (type === 'string') {
    return inferStringSchema(value as string, options);
  }

  if (type === 'number') {
    return inferNumberSchema(value as number, options);
  }

  if (type === 'boolean') {
    return {
      type: 'boolean',
    };
  }

  // 배열 처리
  if (Array.isArray(value)) {
    return inferArraySchema(value, options);
  }

  // Date 객체 처리
  if (value instanceof Date) {
    return {
      type: 'string',
      format: 'date-time',
    };
  }

  // 객체 처리
  if (type === 'object') {
    return inferObjectSchema(value as Record<string, unknown>, options);
  }

  // 기본값
  return {
    type: 'string',
  };
}

/**
 * 문자열 스키마 추론
 */
function inferStringSchema(value: string, options: InferSchemaOptions): SchemaObject {
  const schema: SchemaObject = {
    type: 'string',
  };

  // ISO 날짜 형식 감지
  if (isISODateString(value)) {
    schema.format = 'date-time';
    return schema;
  }

  // 형식 감지가 활성화된 경우
  if (options.detectFormat) {
    const format = detectStringFormat(value);
    if (format) {
      schema.format = format;
    }
  }

  return schema;
}

/**
 * 숫자 스키마 추론
 */
function inferNumberSchema(value: number, options: InferSchemaOptions): SchemaObject {
  // 정수 타입 추론이 활성화되고 정수인 경우
  if (options.inferInteger && Number.isInteger(value)) {
    return {
      type: 'integer',
    };
  }

  return {
    type: 'number',
  };
}

/**
 * 배열 스키마 추론
 */
function inferArraySchema(value: unknown[], options: InferSchemaOptions): SchemaObject {
  const schema: SchemaObject = {
    type: 'array',
  };

  // 빈 배열인 경우
  if (value.length === 0) {
    schema.items = {
      type: 'string',
    };
    return schema;
  }

  // 첫 번째 항목의 타입 추론
  const firstItemSchema = inferSchema(value[0], options);

  // 객체 배열인 경우 모든 항목의 스키마를 병합
  if (firstItemSchema.type === 'object') {
    schema.items = mergeObjectSchemas(value.map((item) => inferSchema(item, options)));
  } else {
    schema.items = firstItemSchema;
  }

  return schema;
}

/**
 * 객체 스키마 추론
 */
function inferObjectSchema(
  value: Record<string, unknown>,
  options: InferSchemaOptions
): SchemaObject {
  const schema: SchemaObject = {
    type: 'object',
    properties: {},
    required: [],
  };

  // 각 프로퍼티의 스키마 추론
  for (const [key, val] of Object.entries(value)) {
    if (schema.properties) {
      schema.properties[key] = inferSchema(val, options);
    }

    // null이 아닌 값만 required에 추가
    if (val !== null && schema.required) {
      schema.required.push(key);
    }
  }

  // required가 비어있으면 제거
  if (schema.required && schema.required.length === 0) {
    delete schema.required;
  }

  return schema;
}

/**
 * 여러 객체 스키마를 병합
 */
function mergeObjectSchemas(schemas: SchemaObject[]): SchemaObject {
  if (schemas.length === 0) {
    return { type: 'object' };
  }

  if (schemas.length === 1) {
    return schemas[0] as SchemaObject;
  }

  const merged: SchemaObject = {
    type: 'object',
    properties: {},
    required: [],
  };

  const requiredCounts = new Map<string, number>();

  // 모든 스키마의 프로퍼티 병합
  for (const schema of schemas) {
    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        if (merged.properties && !merged.properties[key]) {
          merged.properties[key] = value;
        }
      }
    }

    // required 카운팅
    if (schema.required) {
      for (const key of schema.required) {
        requiredCounts.set(key, (requiredCounts.get(key) || 0) + 1);
      }
    }
  }

  // 모든 스키마에서 required인 필드만 required로 설정
  if (merged.required) {
    for (const [key, count] of requiredCounts.entries()) {
      if (count === schemas.length) {
        merged.required.push(key);
      }
    }
  }

  // required가 비어있으면 제거
  if (merged.required && merged.required.length === 0) {
    delete merged.required;
  }

  return merged;
}

/**
 * ISO 8601 날짜 문자열인지 확인
 */
function isISODateString(value: string): boolean {
  // ISO 8601 형식: YYYY-MM-DDTHH:mm:ss.sssZ
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return isoDateRegex.test(value);
}

/**
 * 문자열 형식 감지
 */
function detectStringFormat(value: string): string | undefined {
  // 이메일 형식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(value)) {
    return 'email';
  }

  // URL 형식
  const urlRegex = /^https?:\/\/.+/;
  if (urlRegex.test(value)) {
    return 'uri';
  }

  return undefined;
}
