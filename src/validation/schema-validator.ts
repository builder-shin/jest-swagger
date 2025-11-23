/**
 * JSON Schema 검증 모듈
 *
 * Ajv를 사용하여 JSON Schema 검증 및 스키마 자동 추론 기능 제공
 */

import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { SchemaObject } from '../types/openapi.types';
import { inferSchema as inferSchemaUtil, InferSchemaOptions } from '../builders/schema-inference';

/**
 * 검증 결과 인터페이스
 */
export interface ValidationResult {
  /** 검증 성공 여부 */
  valid: boolean;
  /** 검증 에러 목록 */
  errors: Array<{
    /** 에러가 발생한 경로 */
    path: string;
    /** 에러 메시지 */
    message: string;
  }>;
}

/**
 * JSON Schema 검증 클래스
 */
export class SchemaValidator {
  /** Ajv 인스턴스 (모든 에러 수집 활성화) */
  private static ajv: Ajv;

  /**
   * Ajv 인스턴스 초기화 (lazy initialization)
   */
  private static getAjv(): Ajv {
    if (!SchemaValidator.ajv) {
      SchemaValidator.ajv = new Ajv({
        allErrors: true,
        strict: false, // OpenAPI 스키마와의 호환성을 위해
        validateFormats: true,
      });
      // 표준 포맷 검증 추가 (email, uri, date-time 등)
      addFormats(SchemaValidator.ajv);
    }
    return SchemaValidator.ajv;
  }

  /**
   * 데이터를 스키마에 대해 검증
   *
   * @param schema - 검증할 JSON Schema
   * @param data - 검증할 데이터
   * @returns 검증 결과
   */
  static validate(schema: SchemaObject, data: unknown): ValidationResult {
    const ajv = SchemaValidator.getAjv();

    try {
      const validate = ajv.compile(schema);
      const valid = validate(data);

      if (valid) {
        return {
          valid: true,
          errors: [],
        };
      }

      return {
        valid: false,
        errors: SchemaValidator.formatErrors(validate.errors || []),
      };
    } catch (error) {
      // 스키마 컴파일 실패 시
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: `스키마 컴파일 실패: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  /**
   * 런타임 데이터에서 스키마 자동 추론
   *
   * @param data - 추론할 데이터
   * @param options - 추론 옵션
   * @returns 추론된 스키마
   */
  static inferSchema(data: unknown, options?: InferSchemaOptions): SchemaObject {
    const defaultOptions: InferSchemaOptions = {
      inferInteger: true,
      detectFormat: true,
      ...options,
    };

    return inferSchemaUtil(data, defaultOptions);
  }

  /**
   * 스키마가 제공되면 검증, 없으면 추론 후 검증
   *
   * @param providedSchema - 제공된 스키마 (없으면 자동 추론)
   * @param data - 검증할 데이터
   * @param options - 스키마 추론 옵션
   * @returns 사용된 스키마와 검증 결과
   */
  static validateOrInfer(
    providedSchema: SchemaObject | undefined,
    data: unknown,
    options?: InferSchemaOptions
  ): { schema: SchemaObject; validation: ValidationResult } {
    const schema = providedSchema || SchemaValidator.inferSchema(data, options);
    const validation = SchemaValidator.validate(schema, data);

    return {
      schema,
      validation,
    };
  }

  /**
   * Ajv 에러를 표준 형식으로 변환
   *
   * @param errors - Ajv 에러 객체 배열
   * @returns 포맷된 에러 배열
   */
  private static formatErrors(errors: ErrorObject[]): ValidationResult['errors'] {
    return errors.map((error) => {
      const path = error.instancePath || '/';
      let message = error.message || '알 수 없는 에러';

      // 에러 타입별 메시지 커스터마이징
      if (error.keyword === 'required') {
        const missingProperty = (error.params as any)['missingProperty'];
        message = `필수 프로퍼티 '${missingProperty}'가 누락되었습니다 (required property missing)`;
      } else if (error.keyword === 'type') {
        message = `타입 불일치: ${error.message}`;
      } else if (error.keyword === 'format') {
        message = `형식 불일치: ${error.message}`;
      } else if (error.keyword === 'enum') {
        message = `허용되지 않은 값: ${error.message}`;
      } else if (error.keyword === 'pattern') {
        message = `패턴 불일치: ${error.message}`;
      } else if (error.keyword === 'minimum' || error.keyword === 'maximum') {
        message = `범위 제약 위반: ${error.message}`;
      } else if (error.keyword === 'minLength' || error.keyword === 'maxLength') {
        message = `길이 제약 위반: ${error.message}`;
      } else if (error.keyword === 'minItems' || error.keyword === 'maxItems') {
        message = `배열 크기 제약 위반: ${error.message}`;
      } else if (error.keyword === 'minProperties' || error.keyword === 'maxProperties') {
        message = `프로퍼티 개수 제약 위반: ${error.message}`;
      }

      return {
        path,
        message,
      };
    });
  }
}
