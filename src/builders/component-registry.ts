/**
 * 컴포넌트 레지스트리
 *
 * 재사용 가능한 OpenAPI 컴포넌트(스키마, 응답, 파라미터 등)를 관리
 */

import type { OpenAPISchema, ResponseObject, ParameterObject } from '../types/openapi.types';

/**
 * 컴포넌트 타입
 */
export type ComponentType = 'schemas' | 'responses' | 'parameters' | 'examples' | 'requestBodies';

/**
 * 컴포넌트 레지스트리
 */
export class ComponentRegistry {
  private schemas: Map<string, OpenAPISchema> = new Map();
  private responses: Map<string, ResponseObject> = new Map();
  private parameters: Map<string, ParameterObject> = new Map();
  private examples: Map<string, unknown> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private requestBodies: Map<string, any> = new Map();

  /**
   * 스키마 등록
   */
  registerSchema(name: string, schema: OpenAPISchema): void {
    this.schemas.set(name, schema);
  }

  /**
   * 스키마 조회
   */
  getSchema(name: string): OpenAPISchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * 모든 스키마 조회
   */
  getAllSchemas(): Record<string, OpenAPISchema> {
    return Object.fromEntries(this.schemas);
  }

  /**
   * 스키마 존재 여부 확인
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * 스키마 삭제
   */
  deleteSchema(name: string): boolean {
    return this.schemas.delete(name);
  }

  /**
   * 응답 등록
   */
  registerResponse(name: string, response: ResponseObject): void {
    this.responses.set(name, response);
  }

  /**
   * 응답 조회
   */
  getResponse(name: string): ResponseObject | undefined {
    return this.responses.get(name);
  }

  /**
   * 모든 응답 조회
   */
  getAllResponses(): Record<string, ResponseObject> {
    return Object.fromEntries(this.responses);
  }

  /**
   * 파라미터 등록
   */
  registerParameter(name: string, parameter: ParameterObject): void {
    this.parameters.set(name, parameter);
  }

  /**
   * 파라미터 조회
   */
  getParameter(name: string): ParameterObject | undefined {
    return this.parameters.get(name);
  }

  /**
   * 모든 파라미터 조회
   */
  getAllParameters(): Record<string, ParameterObject> {
    return Object.fromEntries(this.parameters);
  }

  /**
   * 예제 등록
   */
  registerExample(name: string, example: unknown): void {
    this.examples.set(name, example);
  }

  /**
   * 예제 조회
   */
  getExample(name: string): unknown {
    return this.examples.get(name);
  }

  /**
   * 요청 본문 등록
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerRequestBody(name: string, requestBody: any): void {
    this.requestBodies.set(name, requestBody);
  }

  /**
   * 요청 본문 조회
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRequestBody(name: string): any {
    return this.requestBodies.get(name);
  }

  /**
   * 스키마를 $ref로 참조
   */
  createSchemaReference(name: string): OpenAPISchema {
    return {
      $ref: `#/components/schemas/${name}`,
    };
  }

  /**
   * 응답을 $ref로 참조
   */
  createResponseReference(name: string): { $ref: string } {
    return {
      $ref: `#/components/responses/${name}`,
    };
  }

  /**
   * 파라미터를 $ref로 참조
   */
  createParameterReference(name: string): { $ref: string } {
    return {
      $ref: `#/components/parameters/${name}`,
    };
  }

  /**
   * 모든 컴포넌트를 OpenAPI components 객체로 변환
   */
  toOpenAPIComponents(): {
    schemas?: Record<string, OpenAPISchema>;
    responses?: Record<string, ResponseObject>;
    parameters?: Record<string, ParameterObject>;
    examples?: Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestBodies?: Record<string, any>;
  } {
    const components: {
      schemas?: Record<string, OpenAPISchema>;
      responses?: Record<string, ResponseObject>;
      parameters?: Record<string, ParameterObject>;
      examples?: Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requestBodies?: Record<string, any>;
    } = {};

    if (this.schemas.size > 0) {
      components.schemas = this.getAllSchemas();
    }
    if (this.responses.size > 0) {
      components.responses = this.getAllResponses();
    }
    if (this.parameters.size > 0) {
      components.parameters = this.getAllParameters();
    }
    if (this.examples.size > 0) {
      components.examples = Object.fromEntries(this.examples);
    }
    if (this.requestBodies.size > 0) {
      components.requestBodies = Object.fromEntries(this.requestBodies);
    }

    return components;
  }

  /**
   * 레지스트리 초기화
   */
  clear(): void {
    this.schemas.clear();
    this.responses.clear();
    this.parameters.clear();
    this.examples.clear();
    this.requestBodies.clear();
  }

  /**
   * 컴포넌트 개수 조회
   */
  getComponentCount(type?: ComponentType): number {
    if (!type) {
      return (
        this.schemas.size +
        this.responses.size +
        this.parameters.size +
        this.examples.size +
        this.requestBodies.size
      );
    }

    switch (type) {
      case 'schemas':
        return this.schemas.size;
      case 'responses':
        return this.responses.size;
      case 'parameters':
        return this.parameters.size;
      case 'examples':
        return this.examples.size;
      case 'requestBodies':
        return this.requestBodies.size;
      default:
        return 0;
    }
  }
}

/**
 * 전역 컴포넌트 레지스트리 인스턴스
 */
export const globalComponentRegistry = new ComponentRegistry();
