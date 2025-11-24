/**
 * JSON Schema 병합 유틸리티
 *
 * 여러 테스트 실행에서 동일한 엔드포인트에 대해 다른 필드를 가진 응답이 캡처될 때
 * 이를 병합하여 더 완전한 스키마를 생성합니다.
 */

import { SchemaObject } from '../types/openapi.types';

/**
 * JSON Schema 병합 클래스
 */
export class SchemaMerger {
  /**
   * 여러 스키마를 하나로 병합
   * - 모든 properties를 포함
   * - 모든 스키마에 존재하는 필드만 required로 설정
   * - 타입 충돌 시 union 타입 사용 (선택사항)
   *
   * @param schemas - 병합할 스키마 배열
   * @returns 병합된 스키마
   */
  static merge(schemas: SchemaObject[]): SchemaObject {
    // 빈 배열인 경우 기본 객체 스키마 반환
    if (!schemas || schemas.length === 0) {
      return {
        type: 'object',
        properties: {},
      };
    }

    // 단일 스키마인 경우 그대로 반환
    if (schemas.length === 1) {
      const firstSchema = schemas[0];
      if (!firstSchema) {
        return { type: 'object', properties: {} };
      }
      return firstSchema;
    }

    // 첫 번째 스키마를 기반으로 병합 시작
    const firstSchema = schemas[0];
    if (!firstSchema) {
      return { type: 'object', properties: {} };
    }

    let result = firstSchema;

    // 나머지 스키마들을 순차적으로 병합
    for (let i = 1; i < schemas.length; i++) {
      const schema = schemas[i];
      if (schema) {
        result = this.mergeTwoSchemas(result, schema);
      }
    }

    return result;
  }

  /**
   * 두 스키마 병합 (헬퍼 메서드)
   *
   * @param schema1 - 첫 번째 스키마
   * @param schema2 - 두 번째 스키마
   * @returns 병합된 스키마
   */
  private static mergeTwoSchemas(schema1: SchemaObject, schema2: SchemaObject): SchemaObject {
    // 타입이 다른 경우 첫 번째 스키마 우선
    const type = schema1.type || schema2.type;

    // 객체 타입이 아닌 경우 첫 번째 스키마 반환
    if (type !== 'object' && type !== undefined) {
      return schema1;
    }

    // properties 병합
    const mergedProperties: Record<string, SchemaObject> = {
      ...(schema1.properties || {}),
    };

    // schema2의 properties를 병합
    if (schema2.properties) {
      Object.entries(schema2.properties).forEach(([key, value]) => {
        if (mergedProperties[key]) {
          // 동일한 키가 존재하면 재귀적으로 병합
          mergedProperties[key] = this.mergePropertySchemas(mergedProperties[key], value);
        } else {
          // 새로운 키는 그대로 추가
          mergedProperties[key] = value;
        }
      });
    }

    // required 필드 병합 (교집합 - 모든 스키마에 존재하는 필드만)
    const required1 = new Set(schema1.required || []);
    const required2 = new Set(schema2.required || []);

    const mergedRequired = [...required1].filter((field) => required2.has(field));

    const result: SchemaObject = {
      type: 'object',
      properties: mergedProperties,
    };

    if (mergedRequired.length > 0) {
      result.required = mergedRequired;
    }

    return result;
  }

  /**
   * 동일한 프로퍼티의 스키마 병합
   *
   * @param schema1 - 첫 번째 프로퍼티 스키마
   * @param schema2 - 두 번째 프로퍼티 스키마
   * @returns 병합된 프로퍼티 스키마
   */
  private static mergePropertySchemas(schema1: SchemaObject, schema2: SchemaObject): SchemaObject {
    // 타입이 동일한 경우
    if (schema1.type === schema2.type) {
      // 객체 타입인 경우 재귀적으로 병합
      if (schema1.type === 'object') {
        return this.mergeTwoSchemas(schema1, schema2);
      }

      // 배열 타입인 경우 items 병합
      if (schema1.type === 'array' && schema1.items && schema2.items) {
        return {
          type: 'array',
          items: this.mergePropertySchemas(schema1.items, schema2.items),
        };
      }

      // 기타 타입은 첫 번째 스키마 우선
      return schema1;
    }

    // 타입이 다른 경우 - oneOf를 사용하여 union 타입 표현
    return {
      oneOf: [schema1, schema2],
    };
  }
}
