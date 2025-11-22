/**
 * Joi 스키마를 OpenAPI 스키마로 변환하는 컨버터
 */

import type Joi from 'joi';
import type { OpenAPISchema } from '../types/openapi.types';

/**
 * Joi 스키마 타입
 */
type JoiSchema = Joi.Schema;

/**
 * Joi 스키마를 OpenAPI 3.0 스키마로 변환
 */
export class JoiSchemaConverter {
  /**
   * Joi 스키마를 OpenAPI 스키마로 변환
   */
  convert(joiSchema: JoiSchema): OpenAPISchema {
    const description = joiSchema.describe();
    return this.convertDescription(description);
  }

  /**
   * Joi description을 OpenAPI 스키마로 변환
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertDescription(desc: any): OpenAPISchema {
    const result: OpenAPISchema = {};

    // 타입 변환
    switch (desc.type) {
      case 'string':
        result.type = 'string';
        this.applyStringRules(desc, result);
        break;
      case 'number':
        result.type = 'number';
        this.applyNumberRules(desc, result);
        break;
      case 'boolean':
        result.type = 'boolean';
        break;
      case 'date':
        result.type = 'string';
        result.format = 'date-time';
        break;
      case 'object':
        result.type = 'object';
        this.applyObjectRules(desc, result);
        break;
      case 'array':
        result.type = 'array';
        this.applyArrayRules(desc, result);
        break;
      case 'alternatives':
        this.applyAlternativesRules(desc, result);
        break;
      default:
        result.type = 'object';
        result.additionalProperties = true;
    }

    // 공통 규칙 적용
    if (desc.flags?.description) {
      result.description = desc.flags.description;
    }
    if (desc.flags?.default !== undefined) {
      result.default = desc.flags.default;
    }
    if (desc.allow?.includes(null)) {
      result.nullable = true;
    }

    return result;
  }

  /**
   * 문자열 규칙 적용
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyStringRules(desc: any, result: OpenAPISchema): void {
    const rules = desc.rules || [];

    for (const rule of rules) {
      switch (rule.name) {
        case 'min':
          result.minLength = rule.args?.limit;
          break;
        case 'max':
          result.maxLength = rule.args?.limit;
          break;
        case 'email':
          result.format = 'email';
          break;
        case 'uri':
          result.format = 'uri';
          break;
        case 'uuid':
          result.format = 'uuid';
          break;
        case 'pattern':
          if (rule.args?.regex) {
            result.pattern = rule.args.regex.source || rule.args.regex.toString();
          }
          break;
      }
    }

    // 허용된 값 (enum)
    if (desc.allow && desc.allow.length > 0 && !desc.allow.includes(null)) {
      result.enum = desc.allow;
    }
  }

  /**
   * 숫자 규칙 적용
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyNumberRules(desc: any, result: OpenAPISchema): void {
    const rules = desc.rules || [];

    for (const rule of rules) {
      switch (rule.name) {
        case 'min':
          result.minimum = rule.args?.limit;
          break;
        case 'max':
          result.maximum = rule.args?.limit;
          break;
        case 'integer':
          result.type = 'integer';
          break;
        case 'multiple':
          result.multipleOf = rule.args?.base;
          break;
        case 'positive':
          result.minimum = 0;
          result.exclusiveMinimum = true;
          break;
        case 'negative':
          result.maximum = 0;
          result.exclusiveMaximum = true;
          break;
      }
    }
  }

  /**
   * 객체 규칙 적용
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyObjectRules(desc: any, result: OpenAPISchema): void {
    if (desc.keys) {
      result.properties = {};
      result.required = [];

      for (const [key, value] of Object.entries(desc.keys)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const propDesc = value as any;
        result.properties[key] = this.convertDescription(propDesc);

        // required 체크
        if (propDesc.flags?.presence === 'required') {
          result.required.push(key);
        }
      }

      if (result.required.length === 0) {
        delete result.required;
      }
    }
  }

  /**
   * 배열 규칙 적용
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyArrayRules(desc: any, result: OpenAPISchema): void {
    if (desc.items && desc.items.length > 0) {
      result.items = this.convertDescription(desc.items[0]);
    } else {
      result.items = { type: 'object', additionalProperties: true };
    }

    const rules = desc.rules || [];
    for (const rule of rules) {
      switch (rule.name) {
        case 'min':
          result.minItems = rule.args?.limit;
          break;
        case 'max':
          result.maxItems = rule.args?.limit;
          break;
        case 'unique':
          result.uniqueItems = true;
          break;
      }
    }
  }

  /**
   * Alternatives 규칙 적용 (oneOf)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyAlternativesRules(desc: any, result: OpenAPISchema): void {
    if (desc.matches && desc.matches.length > 0) {
      result.oneOf = desc.matches.map((match: { schema: unknown }) =>
        this.convertDescription(match.schema)
      );
    }
  }
}
