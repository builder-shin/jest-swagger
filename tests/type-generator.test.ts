/**
 * 타입 생성 시스템 테스트
 * OpenAPI 문서에서 TypeScript 타입 자동 생성
 */

import { TypeGenerator } from '../src/generators/type-generator';
import type { OpenAPIDocument, SchemaObject } from '../src/types/openapi.types';

describe('TypeGenerator', () => {
  let generator: TypeGenerator;

  beforeEach(() => {
    generator = new TypeGenerator();
  });

  describe('기본 타입 생성', () => {
    it('문자열 타입을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'string',
        description: '사용자 이름',
      };

      const result = generator.generateType(schema, 'UserName');
      expect(result).toContain('export type UserName = string');
      expect(result).toContain('사용자 이름');
    });

    it('숫자 타입을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'number',
        description: '나이',
      };

      const result = generator.generateType(schema, 'Age');
      expect(result).toContain('export type Age = number');
    });

    it('불린 타입을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'boolean',
        description: '활성 상태',
      };

      const result = generator.generateType(schema, 'IsActive');
      expect(result).toContain('export type IsActive = boolean');
    });
  });

  describe('복잡한 타입 생성', () => {
    it('객체 타입을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'object',
        description: '사용자 정보',
        required: ['id', 'name'],
        properties: {
          id: { type: 'number', description: '사용자 ID' },
          name: { type: 'string', description: '사용자 이름' },
          email: { type: 'string', description: '이메일' },
        },
      };

      const result = generator.generateType(schema, 'User');
      expect(result).toContain('export interface User');
      expect(result).toContain('id: number');
      expect(result).toContain('name: string');
      expect(result).toContain('email?: string');
    });

    it('배열 타입을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'array',
        description: '사용자 목록',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
        },
      };

      const result = generator.generateType(schema, 'UserList');
      expect(result).toContain('export type UserList = Array<');
    });

    it('중첩된 객체 타입을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              profile: {
                type: 'object',
                properties: {
                  bio: { type: 'string' },
                },
              },
            },
          },
        },
      };

      const result = generator.generateType(schema, 'NestedUser');
      expect(result).toContain('export interface NestedUser');
      expect(result).toContain('user?:');
      expect(result).toContain('profile?:');
      expect(result).toContain('bio?: string');
    });
  });

  describe('Enum 타입 생성', () => {
    it('문자열 enum을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'string',
        enum: ['admin', 'user', 'guest'],
        description: '사용자 역할',
      };

      const result = generator.generateType(schema, 'UserRole');
      expect(result).toContain("export type UserRole = 'admin' | 'user' | 'guest'");
    });

    it('숫자 enum을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'number',
        enum: [1, 2, 3],
      };

      const result = generator.generateType(schema, 'Priority');
      expect(result).toContain('export type Priority = 1 | 2 | 3');
    });
  });

  describe('Nullable 타입', () => {
    it('nullable 타입을 생성해야 함', () => {
      const schema: SchemaObject = {
        type: 'string',
        nullable: true,
      };

      const result = generator.generateType(schema, 'NullableString');
      expect(result).toContain('export type NullableString = string | null');
    });
  });

  describe('OpenAPI 문서 전체 타입 생성', () => {
    it('전체 OpenAPI 문서에서 타입을 생성해야 함', () => {
      const document: OpenAPIDocument = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: '성공',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
      };

      const result = generator.generateFromDocument(document);
      expect(result).toContain('export interface User');
      expect(result).toContain('id: number');
      expect(result).toContain('name: string');
      expect(result).toContain('email?: string');
    });
  });

  describe('$ref 참조 처리', () => {
    it('$ref 참조를 올바르게 처리해야 함', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
        },
      };

      const result = generator.generateType(schema, 'UserContainer');
      expect(result).toContain('user?: User');
    });
  });

  describe('파일 생성', () => {
    it('타입 정의를 파일로 저장할 수 있어야 함', async () => {
      const document: OpenAPIDocument = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
            },
          },
        },
      };

      const outputPath = './types/api.ts';
      await expect(generator.generateToFile(document, outputPath)).resolves.not.toThrow();
    });
  });

  describe('타입 검증 주석', () => {
    it('검증 규칙을 JSDoc 주석으로 추가해야 함', () => {
      const schema: SchemaObject = {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[a-zA-Z]+$',
        description: '사용자 이름',
      };

      const result = generator.generateType(schema, 'UserName');
      expect(result).toContain('@minLength 3');
      expect(result).toContain('@maxLength 50');
      expect(result).toContain('@pattern ^[a-zA-Z]+$');
    });

    it('숫자 검증 규칙을 주석으로 추가해야 함', () => {
      const schema: SchemaObject = {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: '점수',
      };

      const result = generator.generateType(schema, 'Score');
      expect(result).toContain('@minimum 0');
      expect(result).toContain('@maximum 100');
    });
  });

  describe('readOnly와 writeOnly', () => {
    it('readOnly 속성을 표시해야 함', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number', readOnly: true },
          name: { type: 'string' },
        },
      };

      const result = generator.generateType(schema, 'User');
      expect(result).toContain('readonly id');
    });
  });
});
