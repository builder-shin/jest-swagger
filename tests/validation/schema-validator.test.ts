/**
 * SchemaValidator 테스트
 */

import { SchemaValidator } from '../../src/validation/schema-validator';
import { SchemaObject } from '../../src/types/openapi.types';

describe('SchemaValidator', () => {
  describe('validate', () => {
    describe('Test Case 2.1.1: Validate Response Against Schema', () => {
      it('유효한 응답 검증 성공', () => {
        const schema: SchemaObject = {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        };

        const data = {
          id: 1,
          name: 'John',
        };

        const result = SchemaValidator.validate(schema, data);

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('유효하지 않은 응답 검증 실패 및 에러 메시지 확인', () => {
        const schema: SchemaObject = {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        };

        const data = {
          id: 'not-a-number', // 타입 불일치
          name: 'John',
        };

        const result = SchemaValidator.validate(schema, data);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toHaveProperty('path');
        expect(result.errors[0]).toHaveProperty('message');
        if (result.errors[0]) {
          expect(result.errors[0].path).toContain('id');
        }
      });

      it('복잡한 중첩 객체 검증', () => {
        const schema: SchemaObject = {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                profile: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    age: { type: 'integer' },
                  },
                  required: ['email'],
                },
              },
              required: ['id', 'profile'],
            },
          },
          required: ['user'],
        };

        const validData = {
          user: {
            id: 1,
            profile: {
              email: 'test@example.com',
              age: 30,
            },
          },
        };

        const result = SchemaValidator.validate(schema, validData);
        expect(result.valid).toBe(true);

        const invalidData = {
          user: {
            id: 1,
            profile: {
              email: 'invalid-email', // 이메일 형식 불일치
              age: 30,
            },
          },
        };

        const invalidResult = SchemaValidator.validate(schema, invalidData);
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors.length).toBeGreaterThan(0);
      });

      it('배열 타입 검증', () => {
        const schema: SchemaObject = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
            required: ['id', 'name'],
          },
        };

        const validData = [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ];

        const result = SchemaValidator.validate(schema, validData);
        expect(result.valid).toBe(true);

        const invalidData = [
          { id: 1, name: 'Alice' },
          { id: 'two', name: 'Bob' }, // 타입 불일치
        ];

        const invalidResult = SchemaValidator.validate(schema, invalidData);
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors.length).toBeGreaterThan(0);
      });

      it('required 필드 검증', () => {
        const schema: SchemaObject = {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
          required: ['id', 'name'],
        };

        const validData = {
          id: 1,
          name: 'John',
          // email은 선택적이므로 없어도 됨
        };

        const result = SchemaValidator.validate(schema, validData);
        expect(result.valid).toBe(true);

        const invalidData = {
          id: 1,
          // name이 누락됨
        };

        const invalidResult = SchemaValidator.validate(schema, invalidData);
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors.length).toBeGreaterThan(0);
        if (invalidResult.errors[0]) {
          expect(invalidResult.errors[0].message).toContain('required');
        }
      });
    });

    describe('Test Case 2.1.2: Auto-Infer Schema from Response', () => {
      it('객체에서 스키마 추론', () => {
        const data = {
          id: 1,
          name: 'John',
          email: 'john@example.com',
          active: true,
        };

        const schema = SchemaValidator.inferSchema(data);

        expect(schema.type).toBe('object');
        expect(schema.properties).toBeDefined();
        expect(schema.properties?.['id']).toEqual({ type: 'integer' });
        expect(schema.properties?.['name']).toEqual({ type: 'string' });
        expect(schema.properties?.['email']).toEqual({ type: 'string', format: 'email' });
        expect(schema.properties?.['active']).toEqual({ type: 'boolean' });
        expect(schema.required).toContain('id');
        expect(schema.required).toContain('name');
      });

      it('배열에서 스키마 추론', () => {
        const data = [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ];

        const schema = SchemaValidator.inferSchema(data);

        expect(schema.type).toBe('array');
        expect(schema.items).toBeDefined();
        expect(schema.items).toMatchObject({
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
          },
        });
      });

      it('원시 타입에서 스키마 추론', () => {
        expect(SchemaValidator.inferSchema('hello')).toEqual({ type: 'string' });
        expect(SchemaValidator.inferSchema(123)).toEqual({ type: 'integer' });
        expect(SchemaValidator.inferSchema(123.45, { inferInteger: false })).toEqual({
          type: 'number',
        });
        expect(SchemaValidator.inferSchema(true)).toEqual({ type: 'boolean' });
      });

      it('날짜/이메일 포맷 감지', () => {
        const emailSchema = SchemaValidator.inferSchema('test@example.com', {
          detectFormat: true,
        });
        expect(emailSchema).toEqual({ type: 'string', format: 'email' });

        const dateSchema = SchemaValidator.inferSchema('2024-01-15T10:30:00Z');
        expect(dateSchema).toEqual({ type: 'string', format: 'date-time' });

        const urlSchema = SchemaValidator.inferSchema('https://example.com', {
          detectFormat: true,
        });
        expect(urlSchema).toEqual({ type: 'string', format: 'uri' });
      });
    });

    describe('validateOrInfer', () => {
      it('스키마가 제공되면 검증만 수행', () => {
        const schema: SchemaObject = {
          type: 'object',
          properties: {
            id: { type: 'integer' },
          },
          required: ['id'],
        };

        const data = { id: 1 };

        const result = SchemaValidator.validateOrInfer(schema, data);

        expect(result.schema).toEqual(schema);
        expect(result.validation.valid).toBe(true);
      });

      it('스키마가 없으면 추론 후 검증', () => {
        const data = {
          id: 1,
          name: 'John',
        };

        const result = SchemaValidator.validateOrInfer(undefined, data);

        expect(result.schema).toBeDefined();
        expect(result.schema.type).toBe('object');
        expect(result.schema.properties?.['id']).toEqual({ type: 'integer' });
        expect(result.schema.properties?.['name']).toEqual({ type: 'string' });
        expect(result.validation.valid).toBe(true);
      });
    });
  });
});
