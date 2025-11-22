/**
 * TypeScript 타입 생성기
 * OpenAPI 스키마에서 TypeScript 타입 정의를 자동 생성
 */

import * as fs from 'fs';
import * as path from 'path';
import type { OpenAPIDocument, SchemaObject } from '../types/openapi.types';

/**
 * TypeScript 타입 생성기 클래스
 */
export class TypeGenerator {
  /**
   * 스키마에서 TypeScript 타입 생성
   */
  public generateType(schema: SchemaObject, typeName: string): string {
    const lines: string[] = [];

    // JSDoc 주석 생성
    const jsdoc = this.generateJSDoc(schema);
    if (jsdoc) {
      lines.push(jsdoc);
    }

    // 타입 정의 생성
    const typeDefinition = this.generateTypeDefinition(schema, typeName);
    lines.push(typeDefinition);

    return lines.join('\n');
  }

  /**
   * OpenAPI 문서 전체에서 타입 생성
   */
  public generateFromDocument(document: OpenAPIDocument): string {
    const lines: string[] = [];

    // 헤더 추가
    lines.push('/**');
    lines.push(` * Generated types from ${document.info.title}`);
    lines.push(` * Version: ${document.info.version}`);
    if (document.info.description) {
      lines.push(` * ${document.info.description}`);
    }
    lines.push(' * @generated This file is auto-generated. Do not edit manually.');
    lines.push(' */');
    lines.push('');

    // components/schemas에서 타입 생성
    if (document.components?.schemas) {
      for (const [name, schema] of Object.entries(document.components.schemas)) {
        const typeDefinition = this.generateType(schema, name);
        lines.push(typeDefinition);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 타입 정의를 파일로 저장
   */
  public async generateToFile(document: OpenAPIDocument, outputPath: string): Promise<void> {
    const content = this.generateFromDocument(document);
    const dir = path.dirname(outputPath);

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 파일 작성
    await fs.promises.writeFile(outputPath, content, 'utf-8');
  }

  /**
   * JSDoc 주석 생성
   */
  private generateJSDoc(schema: SchemaObject): string {
    const lines: string[] = ['/**'];

    // 설명
    if (schema.description) {
      lines.push(` * ${schema.description}`);
    }

    // 검증 규칙
    if (schema.minLength !== undefined) {
      lines.push(` * @minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined) {
      lines.push(` * @maxLength ${schema.maxLength}`);
    }
    if (schema.pattern) {
      lines.push(` * @pattern ${schema.pattern}`);
    }
    if (schema.minimum !== undefined) {
      lines.push(` * @minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined) {
      lines.push(` * @maximum ${schema.maximum}`);
    }
    if (schema.minItems !== undefined) {
      lines.push(` * @minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined) {
      lines.push(` * @maxItems ${schema.maxItems}`);
    }

    // 예제
    if (schema.example !== undefined) {
      lines.push(` * @example ${JSON.stringify(schema.example)}`);
    }

    lines.push(' */');

    // 주석 내용이 없으면 빈 문자열 반환
    if (lines.length <= 2) {
      return '';
    }

    return lines.join('\n');
  }

  /**
   * 타입 정의 생성
   */
  private generateTypeDefinition(schema: SchemaObject, typeName: string): string {
    // $ref 처리
    if (schema.$ref) {
      return this.resolveRef(schema.$ref);
    }

    // enum 처리
    if (schema.enum) {
      return this.generateEnumType(schema, typeName);
    }

    // nullable 처리
    if (schema.nullable) {
      const baseTypeName = this.getTypeString(schema);
      return `export type ${typeName} = ${baseTypeName} | null;`;
    }

    return this.generateBaseType(schema, typeName);
  }

  /**
   * 타입 문자열 생성 (export 키워드 없이)
   */
  private getTypeString(schema: SchemaObject): string {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        if (!schema.items) {
          return 'Array<unknown>';
        }
        return `Array<${this.generateInlineType(schema.items)}>`;
      case 'object':
        return this.generateInlineObjectType(schema);
      default:
        return 'unknown';
    }
  }

  /**
   * 기본 타입 생성
   */
  private generateBaseType(schema: SchemaObject, typeName: string): string {
    switch (schema.type) {
      case 'string':
        return `export type ${typeName} = string;`;
      case 'number':
      case 'integer':
        return `export type ${typeName} = number;`;
      case 'boolean':
        return `export type ${typeName} = boolean;`;
      case 'array':
        return this.generateArrayType(schema, typeName);
      case 'object':
        return this.generateObjectType(schema, typeName);
      default:
        return `export type ${typeName} = unknown;`;
    }
  }

  /**
   * Enum 타입 생성
   */
  private generateEnumType(schema: SchemaObject, typeName: string): string {
    if (!schema.enum || schema.enum.length === 0) {
      return `export type ${typeName} = never;`;
    }

    const values = schema.enum
      .map((value) => {
        if (typeof value === 'string') {
          return `'${value}'`;
        }
        return String(value);
      })
      .join(' | ');

    return `export type ${typeName} = ${values};`;
  }

  /**
   * 배열 타입 생성
   */
  private generateArrayType(schema: SchemaObject, typeName: string): string {
    if (!schema.items) {
      return `export type ${typeName} = Array<unknown>;`;
    }

    const itemType = this.generateInlineType(schema.items);
    return `export type ${typeName} = Array<${itemType}>;`;
  }

  /**
   * 객체 타입 생성
   */
  private generateObjectType(schema: SchemaObject, typeName: string): string {
    const lines: string[] = [`export interface ${typeName} {`];

    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        // 속성 주석
        if (propSchema.description) {
          lines.push(`  /** ${propSchema.description} */`);
        }

        // readonly 처리
        const readonly = propSchema.readOnly ? 'readonly ' : '';

        // 필수 여부
        const required = schema.required?.includes(propName) ? '' : '?';

        // 속성 타입
        const propType = this.generateInlineType(propSchema);

        lines.push(`  ${readonly}${propName}${required}: ${propType};`);
      }
    }

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * 인라인 타입 생성 (속성용)
   */
  private generateInlineType(schema: SchemaObject): string {
    // $ref 처리
    if (schema.$ref) {
      return this.resolveRef(schema.$ref);
    }

    // enum 처리
    if (schema.enum) {
      const values = schema.enum
        .map((value) => {
          if (typeof value === 'string') {
            return `'${value}'`;
          }
          return String(value);
        })
        .join(' | ');
      return values;
    }

    // nullable 처리
    const baseType = this.getInlineBaseType(schema);
    if (schema.nullable) {
      return `${baseType} | null`;
    }

    return baseType;
  }

  /**
   * 인라인 기본 타입 생성
   */
  private getInlineBaseType(schema: SchemaObject): string {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        if (!schema.items) {
          return 'Array<unknown>';
        }
        return `Array<${this.generateInlineType(schema.items)}>`;
      case 'object':
        return this.generateInlineObjectType(schema);
      default:
        return 'unknown';
    }
  }

  /**
   * 인라인 객체 타입 생성
   */
  private generateInlineObjectType(schema: SchemaObject): string {
    if (!schema.properties || Object.keys(schema.properties).length === 0) {
      return 'Record<string, unknown>';
    }

    const props: string[] = [];
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const required = schema.required?.includes(propName) ? '' : '?';
      const readonly = propSchema.readOnly ? 'readonly ' : '';
      const propType = this.generateInlineType(propSchema);
      props.push(`${readonly}${propName}${required}: ${propType}`);
    }

    return `{ ${props.join('; ')} }`;
  }

  /**
   * $ref 참조 해결
   */
  private resolveRef(ref: string): string {
    // #/components/schemas/User -> User
    const parts = ref.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart ?? 'unknown';
  }
}
