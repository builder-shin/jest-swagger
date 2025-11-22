/**
 * Zod 스키마 통합 테스트
 */

import { z } from 'zod';
import { ZodSchemaConverter } from '../../src/integrations/zod-converter';
import type { OpenAPISchema } from '../../src/types/openapi.types';

describe('ZodSchemaConverter', () => {
  let converter: ZodSchemaConverter;

  beforeEach(() => {
    converter = new ZodSchemaConverter();
  });

  describe('기본 타입 변환', () => {
    it('문자열 스키마를 OpenAPI 스키마로 변환해야 한다', () => {
      const zodSchema = z.string();
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
      });
    });

    it('숫자 스키마를 OpenAPI 스키마로 변환해야 한다', () => {
      const zodSchema = z.number();
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'number',
      });
    });

    it('불린 스키마를 OpenAPI 스키마로 변환해야 한다', () => {
      const zodSchema = z.boolean();
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'boolean',
      });
    });

    it('날짜 스키마를 OpenAPI 스키마로 변환해야 한다', () => {
      const zodSchema = z.date();
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        format: 'date-time',
      });
    });
  });

  describe('객체 스키마 변환', () => {
    it('간단한 객체 스키마를 변환해야 한다', () => {
      const zodSchema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      });
    });

    it('중첩된 객체 스키마를 변환해야 한다', () => {
      const zodSchema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
            required: ['name', 'email'],
          },
        },
        required: ['user'],
      });
    });

    it('선택적 속성을 가진 객체를 변환해야 한다', () => {
      const zodSchema = z.object({
        name: z.string(),
        age: z.number().optional(),
      });

      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      });
    });
  });

  describe('배열 스키마 변환', () => {
    it('문자열 배열 스키마를 변환해야 한다', () => {
      const zodSchema = z.array(z.string());
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
    });

    it('객체 배열 스키마를 변환해야 한다', () => {
      const zodSchema = z.array(
        z.object({
          id: z.number(),
          name: z.string(),
        })
      );

      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        },
      });
    });

    it('최소/최대 길이 제약이 있는 배열을 변환해야 한다', () => {
      const zodSchema = z.array(z.string()).min(1).max(10);
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10,
      });
    });
  });

  describe('유니온 및 열거형 변환', () => {
    it('문자열 열거형을 변환해야 한다', () => {
      const zodSchema = z.enum(['red', 'green', 'blue']);
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        enum: ['red', 'green', 'blue'],
      });
    });

    it('유니온 타입을 oneOf로 변환해야 한다', () => {
      const zodSchema = z.union([z.string(), z.number()]);
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        oneOf: [{ type: 'string' }, { type: 'number' }],
      });
    });
  });

  describe('검증 규칙 변환', () => {
    it('문자열 길이 제약을 변환해야 한다', () => {
      const zodSchema = z.string().min(3).max(10);
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        minLength: 3,
        maxLength: 10,
      });
    });

    it('숫자 범위 제약을 변환해야 한다', () => {
      const zodSchema = z.number().min(0).max(100);
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'number',
        minimum: 0,
        maximum: 100,
      });
    });

    it('이메일 형식을 변환해야 한다', () => {
      const zodSchema = z.string().email();
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        format: 'email',
      });
    });

    it('URL 형식을 변환해야 한다', () => {
      const zodSchema = z.string().url();
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        format: 'uri',
      });
    });

    it('UUID 형식을 변환해야 한다', () => {
      const zodSchema = z.string().uuid();
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        format: 'uuid',
      });
    });
  });

  describe('설명 및 기본값', () => {
    it('설명을 변환해야 한다', () => {
      const zodSchema = z.string().describe('사용자 이름');
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        description: '사용자 이름',
      });
    });

    it('기본값을 변환해야 한다', () => {
      const zodSchema = z.string().default('anonymous');
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        default: 'anonymous',
      });
    });
  });

  describe('null 허용 스키마', () => {
    it('nullable 문자열을 변환해야 한다', () => {
      const zodSchema = z.string().nullable();
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'string',
        nullable: true,
      });
    });

    it('nullable 객체를 변환해야 한다', () => {
      const zodSchema = z
        .object({
          name: z.string(),
        })
        .nullable();

      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
        nullable: true,
      });
    });
  });

  describe('레코드 타입 변환', () => {
    it('문자열 키와 숫자 값을 가진 레코드를 변환해야 한다', () => {
      const zodSchema = z.record(z.string(), z.number());
      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'object',
        additionalProperties: { type: 'number' },
      });
    });
  });

  describe('복잡한 스키마 변환', () => {
    it('복잡한 사용자 스키마를 변환해야 한다', () => {
      const zodSchema = z.object({
        id: z.number().int().positive(),
        username: z.string().min(3).max(20),
        email: z.string().email(),
        age: z.number().min(0).max(150).optional(),
        role: z.enum(['admin', 'user', 'guest']),
        tags: z.array(z.string()).min(0).max(5),
        metadata: z.record(z.string(), z.unknown()).optional(),
      });

      const result = converter.convert(zodSchema);

      expect(result).toEqual({
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 0,
            exclusiveMinimum: true,
          },
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
          },
          email: {
            type: 'string',
            format: 'email',
          },
          age: {
            type: 'number',
            minimum: 0,
            maximum: 150,
          },
          role: {
            type: 'string',
            enum: ['admin', 'user', 'guest'],
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 0,
            maxItems: 5,
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['id', 'username', 'email', 'role', 'tags'],
      });
    });
  });
});
