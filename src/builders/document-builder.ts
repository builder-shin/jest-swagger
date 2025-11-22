/**
 * DocumentBuilder 클래스
 *
 * OpenAPI 문서를 프로그래매틱하게 생성하기 위한 빌더
 */

import {
  OpenAPIDocument,
  OperationObject,
  SchemaObject,
  ResponseObject,
  HttpMethod,
} from '../types/openapi.types';

/**
 * 스키마 추가 옵션
 */
export interface AddSchemaOptions {
  /**
   * 기존 스키마와 병합할지 여부
   */
  merge?: boolean;
}

/**
 * OpenAPI 문서 빌더 클래스
 */
export class DocumentBuilder {
  private document: OpenAPIDocument;

  /**
   * DocumentBuilder 생성자
   *
   * @param title - API 제목
   * @param version - API 버전
   */
  constructor(title: string, version: string) {
    this.document = {
      openapi: '3.0.0',
      info: {
        title,
        version,
      },
      paths: {},
    };
  }

  /**
   * API 설명 설정
   *
   * @param description - API 설명
   * @returns this (체이닝용)
   */
  setDescription(description: string): this {
    this.document.info.description = description;
    return this;
  }

  /**
   * 서버 추가
   *
   * @param url - 서버 URL
   * @param description - 서버 설명 (선택)
   * @returns this (체이닝용)
   */
  addServer(url: string, description?: string): this {
    if (!this.document.servers) {
      this.document.servers = [];
    }

    this.document.servers.push({
      url,
      description,
    });

    return this;
  }

  /**
   * 태그 추가
   *
   * @param name - 태그 이름
   * @param description - 태그 설명 (선택)
   * @returns this (체이닝용)
   */
  addTag(name: string, description?: string): this {
    if (!this.document.tags) {
      this.document.tags = [];
    }

    this.document.tags.push({
      name,
      description,
    });

    return this;
  }

  /**
   * 경로 추가
   *
   * @param path - 경로 (예: /users/{id})
   * @param method - HTTP 메서드
   * @param operation - 작업 정의
   * @returns this (체이닝용)
   */
  addPath(path: string, method: HttpMethod, operation: OperationObject): this {
    // 경로가 없으면 생성
    if (!this.document.paths[path]) {
      this.document.paths[path] = {};
    }

    // 메서드 추가
    this.document.paths[path][method] = operation;

    return this;
  }

  /**
   * 스키마 컴포넌트 추가
   *
   * @param name - 스키마 이름
   * @param schema - 스키마 정의
   * @param options - 추가 옵션
   * @returns this (체이닝용)
   */
  addSchema(name: string, schema: SchemaObject, options: AddSchemaOptions = {}): this {
    // components 초기화
    if (!this.document.components) {
      this.document.components = {};
    }
    if (!this.document.components.schemas) {
      this.document.components.schemas = {};
    }

    // 기존 스키마 확인
    const existingSchema = this.document.components.schemas[name];

    if (existingSchema && options.merge) {
      // 병합 모드
      this.document.components.schemas[name] = this.mergeSchemas(existingSchema, schema);
    } else if (!existingSchema) {
      // 새로운 스키마
      this.document.components.schemas[name] = schema;
    }
    // 기존 스키마가 있고 병합 모드가 아니면 덮어쓰지 않음

    return this;
  }

  /**
   * 응답 컴포넌트 추가
   *
   * @param name - 응답 이름
   * @param response - 응답 정의
   * @returns this (체이닝용)
   */
  addResponse(name: string, response: ResponseObject): this {
    // components 초기화
    if (!this.document.components) {
      this.document.components = {};
    }
    if (!this.document.components.responses) {
      this.document.components.responses = {};
    }

    this.document.components.responses[name] = response;

    return this;
  }

  /**
   * 스키마 참조 생성
   *
   * @param name - 스키마 이름
   * @returns 스키마 참조 문자열
   */
  getSchemaRef(name: string): string {
    return `#/components/schemas/${name}`;
  }

  /**
   * 응답 참조 생성
   *
   * @param name - 응답 이름
   * @returns 응답 참조 문자열
   */
  getResponseRef(name: string): string {
    return `#/components/responses/${name}`;
  }

  /**
   * OpenAPI 문서 빌드
   *
   * @returns 완성된 OpenAPI 문서
   */
  build(): OpenAPIDocument {
    // 깊은 복사로 반환
    return JSON.parse(JSON.stringify(this.document)) as OpenAPIDocument;
  }

  /**
   * JSON 문자열로 변환
   *
   * @param space - 들여쓰기 공백 수 (선택)
   * @returns JSON 문자열
   */
  toJSON(space?: number): string {
    return JSON.stringify(this.document, null, space);
  }

  /**
   * 두 스키마 병합
   *
   * @param target - 대상 스키마
   * @param source - 소스 스키마
   * @returns 병합된 스키마
   */
  private mergeSchemas(target: SchemaObject, source: SchemaObject): SchemaObject {
    const merged: SchemaObject = { ...target };

    // type은 그대로 유지
    if (source.type) {
      merged.type = source.type;
    }

    // properties 병합
    if (source.properties && merged.properties) {
      merged.properties = {
        ...merged.properties,
        ...source.properties,
      };
    } else if (source.properties) {
      merged.properties = source.properties;
    }

    // required 병합
    if (source.required && merged.required) {
      // 중복 제거하며 병합
      const combinedRequired = [...merged.required, ...source.required];
      merged.required = Array.from(new Set(combinedRequired));
    } else if (source.required) {
      merged.required = source.required;
    }

    // 기타 속성 병합
    if (source.description) {
      merged.description = source.description;
    }
    if (source.format) {
      merged.format = source.format;
    }
    if (source.items) {
      merged.items = source.items;
    }
    if (source.enum) {
      merged.enum = source.enum;
    }
    if (source.example !== undefined) {
      merged.example = source.example;
    }
    if (source.default !== undefined) {
      merged.default = source.default;
    }
    if (source.nullable !== undefined) {
      merged.nullable = source.nullable;
    }

    return merged;
  }
}
