/**
 * Zod 스키마를 OpenAPI 스키마로 변환하는 컨버터
 *
 * Zod v4+ 기준으로 구현
 */

import type { z } from 'zod';
import type { OpenAPISchema } from '../types/openapi.types';

/**
 * Zod 스키마 타입 정의
 */
type ZodSchema = z.ZodTypeAny;

/**
 * Zod 내부 정의 타입
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZodDef = any;

/**
 * Zod 스키마를 OpenAPI 3.0 스키마로 변환
 */
export class ZodSchemaConverter {
  /**
   * Zod 스키마를 OpenAPI 스키마로 변환
   */
  convert(zodSchema: ZodSchema): OpenAPISchema {
    return this.convertSchema(zodSchema);
  }

  /**
   * 내부 스키마 변환 로직
   */
  private convertSchema(schema: ZodSchema): OpenAPISchema {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodDef: ZodDef = schema._def;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaAny = schema as any;

    // Zod v4+에서는 type 필드가 직접 있음
    const type = zodDef.type || schemaAny.type;

    // 기본 타입 변환
    switch (type) {
      case 'string':
        return this.convertString(schema);
      case 'number':
        return this.convertNumber(schema);
      case 'boolean':
        return this.convertBoolean(schema);
      case 'date':
        return this.convertDate(schema);
      case 'object':
        return this.convertObject(schema);
      case 'array':
        return this.convertArray(schema);
      case 'enum':
        return this.convertEnum(schema);
      case 'union':
        return this.convertUnion(schema);
      case 'optional':
        return this.convertOptional(schema);
      case 'nullable':
        return this.convertNullable(schema);
      case 'default':
        return this.convertDefault(schema);
      case 'record':
        return this.convertRecord(schema);
      case 'unknown':
        return { type: 'object', additionalProperties: true };
      case 'any':
        return { type: 'object', additionalProperties: true };
      default:
        // 알 수 없는 타입은 any로 처리
        return { type: 'object', additionalProperties: true };
    }
  }

  /**
   * 문자열 스키마 변환
   */
  private convertString(schema: ZodSchema): OpenAPISchema {
    const result: OpenAPISchema = { type: 'string' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaAny = schema as any;

    // Zod v4+에서 직접 속성으로 노출되는 값들
    if (schemaAny.minLength !== null && schemaAny.minLength !== undefined) {
      result.minLength = schemaAny.minLength;
    }
    if (schemaAny.maxLength !== null && schemaAny.maxLength !== undefined) {
      result.maxLength = schemaAny.maxLength;
    }
    if (schemaAny.format) {
      // Zod의 'url' 형식을 OpenAPI의 'uri'로 매핑
      result.format = schemaAny.format === 'url' ? 'uri' : schemaAny.format;
    }

    return this.addCommonProperties(schema, result);
  }

  /**
   * 숫자 스키마 변환
   */
  private convertNumber(schema: ZodSchema): OpenAPISchema {
    const result: OpenAPISchema = { type: 'number' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zodDef: ZodDef = schema._def;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaAny = schema as any;

    // JavaScript safe integer 범위
    const MAX_SAFE_INTEGER = 9007199254740991;
    const MIN_SAFE_INTEGER = -9007199254740991;

    // Zod v4+에서 직접 속성으로 노출되는 값들
    if (schemaAny.isInt) {
      result.type = 'integer';
    }

    // Infinity와 safe integer 최대값 필터링
    if (
      schemaAny.minValue !== null &&
      schemaAny.minValue !== undefined &&
      schemaAny.minValue !== -Infinity &&
      schemaAny.minValue !== MIN_SAFE_INTEGER
    ) {
      result.minimum = schemaAny.minValue;
    }

    if (
      schemaAny.maxValue !== null &&
      schemaAny.maxValue !== undefined &&
      schemaAny.maxValue !== Infinity &&
      schemaAny.maxValue !== MAX_SAFE_INTEGER
    ) {
      result.maximum = schemaAny.maxValue;
    }

    // checks 배열에서 추가 정보 추출 (exclusive 정보)
    const checks = zodDef.checks || [];
    for (const check of checks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
      const checkZod = (check as any)._zod;
      if (checkZod?.def) {
        const checkDef = checkZod.def;
        // inclusive가 false인 경우에만 exclusive로 설정
        if (checkDef.check === 'greater_than' && !checkDef.inclusive) {
          result.exclusiveMinimum = true;
        } else if (checkDef.check === 'less_than' && !checkDef.inclusive) {
          result.exclusiveMaximum = true;
        }
      }
    }

    return this.addCommonProperties(schema, result);
  }

  /**
   * 불린 스키마 변환
   */
  private convertBoolean(schema: ZodSchema): OpenAPISchema {
    const result: OpenAPISchema = { type: 'boolean' };
    return this.addCommonProperties(schema, result);
  }

  /**
   * 날짜 스키마 변환
   */
  private convertDate(schema: ZodSchema): OpenAPISchema {
    const result: OpenAPISchema = {
      type: 'string',
      format: 'date-time',
    };
    return this.addCommonProperties(schema, result);
  }

  /**
   * 객체 스키마 변환
   */
  private convertObject(schema: ZodSchema): OpenAPISchema {
    const zodDef: ZodDef = schema._def;
    const shape = zodDef.shape;
    const properties: Record<string, OpenAPISchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const propSchema = value as ZodSchema;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const propDef: ZodDef = propSchema._def;
      const propType = propDef.type || (propSchema as any).type;

      // optional이 아닌 경우 required에 추가
      if (propType !== 'optional') {
        required.push(key);
      }

      // optional인 경우 innerType을 변환
      if (propType === 'optional') {
        properties[key] = this.convertSchema(propDef.innerType);
      } else {
        properties[key] = this.convertSchema(propSchema);
      }
    }

    const result: OpenAPISchema = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      result.required = required;
    }

    return this.addCommonProperties(schema, result);
  }

  /**
   * 배열 스키마 변환
   */
  private convertArray(schema: ZodSchema): OpenAPISchema {
    const zodDef: ZodDef = schema._def;
    const itemSchema = zodDef.element;

    const result: OpenAPISchema = {
      type: 'array',
      items: this.convertSchema(itemSchema),
    };

    // 배열 길이 제약 추가 - Zod v4+에서는 _zod.def에서 가져와야 함
    const checks = zodDef.checks || [];
    for (const check of checks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
      const checkZod = (check as any)._zod;
      if (checkZod?.def) {
        const checkDef = checkZod.def;
        if (checkDef.check === 'min_length' && checkDef.minimum !== undefined) {
          result.minItems = checkDef.minimum;
        }
        if (checkDef.check === 'max_length' && checkDef.maximum !== undefined) {
          result.maxItems = checkDef.maximum;
        }
      }
    }

    return this.addCommonProperties(schema, result);
  }

  /**
   * 열거형 스키마 변환
   */
  private convertEnum(schema: ZodSchema): OpenAPISchema {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaAny = schema as any;
    // Zod v4+에서는 options 배열을 사용
    const values = schemaAny.options || [];
    const result: OpenAPISchema = {
      type: 'string',
      enum: values,
    };
    return this.addCommonProperties(schema, result);
  }

  /**
   * 유니온 스키마 변환
   */
  private convertUnion(schema: ZodSchema): OpenAPISchema {
    const zodDef: ZodDef = schema._def;
    const options = zodDef.options;
    const oneOf = options.map((option: ZodSchema) => this.convertSchema(option));

    const result: OpenAPISchema = { oneOf };
    return this.addCommonProperties(schema, result);
  }

  /**
   * 선택적 스키마 변환
   */
  private convertOptional(schema: ZodSchema): OpenAPISchema {
    const zodDef: ZodDef = schema._def;
    const innerSchema = zodDef.innerType;
    return this.convertSchema(innerSchema);
  }

  /**
   * null 허용 스키마 변환
   */
  private convertNullable(schema: ZodSchema): OpenAPISchema {
    const zodDef: ZodDef = schema._def;
    const innerSchema = zodDef.innerType;
    const result = this.convertSchema(innerSchema);
    result.nullable = true;
    return result;
  }

  /**
   * 기본값을 가진 스키마 변환
   */
  private convertDefault(schema: ZodSchema): OpenAPISchema {
    const zodDef: ZodDef = schema._def;
    const innerSchema = zodDef.innerType;
    // Zod v4+에서 defaultValue는 함수가 아닌 직접 값
    const defaultValue = zodDef.defaultValue;
    const result = this.convertSchema(innerSchema);
    result.default = defaultValue;
    return result;
  }

  /**
   * 레코드 스키마 변환
   */
  private convertRecord(schema: ZodSchema): OpenAPISchema {
    const zodDef: ZodDef = schema._def;
    const valueSchema = zodDef.valueType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
    const valueType = valueSchema._def?.type || (valueSchema as any).type;

    const result: OpenAPISchema = {
      type: 'object',
    };

    // unknown이나 any 타입인 경우 additionalProperties를 true로 설정
    if (valueType === 'unknown' || valueType === 'any') {
      result.additionalProperties = true;
    } else {
      result.additionalProperties = this.convertSchema(valueSchema);
    }

    return this.addCommonProperties(schema, result);
  }

  /**
   * 공통 속성 추가 (description 등)
   */
  private addCommonProperties(schema: ZodSchema, result: OpenAPISchema): OpenAPISchema {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaAny = schema as any;
    // Zod v4+에서는 description이 직접 속성으로 노출됨
    if (schemaAny.description) {
      result.description = schemaAny.description;
    }
    return result;
  }
}
