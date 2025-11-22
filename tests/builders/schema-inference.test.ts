/**
 * 스키마 추론 테스트
 */

import { inferSchema } from '../../src/builders/schema-inference';
import { SchemaObject } from '../../src/types/openapi.types';

describe('inferSchema', () => {
  describe('기본 타입 추론', () => {
    it('문자열을 string 타입으로 추론해야 함', () => {
      const result = inferSchema('hello');

      expect(result).toEqual<SchemaObject>({
        type: 'string',
      });
    });

    it('숫자를 number 타입으로 추론해야 함', () => {
      const result = inferSchema(42);

      expect(result).toEqual<SchemaObject>({
        type: 'number',
      });
    });

    it('정수를 integer 타입으로 추론해야 함', () => {
      const result = inferSchema(42, { inferInteger: true });

      expect(result).toEqual<SchemaObject>({
        type: 'integer',
      });
    });

    it('부동소수점을 number 타입으로 추론해야 함', () => {
      const result = inferSchema(3.14);

      expect(result).toEqual<SchemaObject>({
        type: 'number',
      });
    });

    it('불린을 boolean 타입으로 추론해야 함', () => {
      const result = inferSchema(true);

      expect(result).toEqual<SchemaObject>({
        type: 'boolean',
      });
    });

    it('null을 nullable string으로 추론해야 함', () => {
      const result = inferSchema(null);

      expect(result).toEqual<SchemaObject>({
        type: 'string',
        nullable: true,
      });
    });
  });

  describe('객체 타입 추론', () => {
    it('단순 객체를 올바르게 추론해야 함', () => {
      const data = {
        name: 'John',
        age: 30,
        active: true,
      };

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          active: { type: 'boolean' },
        },
        required: ['name', 'age', 'active'],
      });
    });

    it('중첩 객체를 올바르게 추론해야 함', () => {
      const data = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            email: 'john@example.com',
          },
        },
      };

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  age: { type: 'number' },
                  email: { type: 'string' },
                },
                required: ['age', 'email'],
              },
            },
            required: ['name', 'profile'],
          },
        },
        required: ['user'],
      });
    });

    it('null 값이 있는 객체를 nullable로 추론해야 함', () => {
      const data = {
        name: 'John',
        middleName: null,
        age: 30,
      };

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'object',
        properties: {
          name: { type: 'string' },
          middleName: { type: 'string', nullable: true },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      });
    });
  });

  describe('배열 타입 추론', () => {
    it('문자열 배열을 올바르게 추론해야 함', () => {
      const data = ['apple', 'banana', 'cherry'];

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'array',
        items: { type: 'string' },
      });
    });

    it('숫자 배열을 올바르게 추론해야 함', () => {
      const data = [1, 2, 3, 4, 5];

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'array',
        items: { type: 'number' },
      });
    });

    it('객체 배열을 올바르게 추론해야 함', () => {
      const data = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
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

    it('빈 배열을 array 타입으로 추론해야 함', () => {
      const data: unknown[] = [];

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'array',
        items: { type: 'string' },
      });
    });

    it('중첩 배열을 올바르게 추론해야 함', () => {
      const data = [
        [1, 2],
        [3, 4],
      ];

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'number' },
        },
      });
    });
  });

  describe('날짜 및 형식 감지', () => {
    it('ISO 날짜 문자열을 date-time 형식으로 추론해야 함', () => {
      const data = '2024-01-01T00:00:00.000Z';

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'string',
        format: 'date-time',
      });
    });

    it('Date 객체를 date-time 형식으로 추론해야 함', () => {
      const data = new Date('2024-01-01');

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'string',
        format: 'date-time',
      });
    });

    it('이메일 형식 문자열을 감지해야 함', () => {
      const data = 'test@example.com';

      const result = inferSchema(data, { detectFormat: true });

      expect(result).toEqual<SchemaObject>({
        type: 'string',
        format: 'email',
      });
    });

    it('URL 형식 문자열을 감지해야 함', () => {
      const data = 'https://example.com';

      const result = inferSchema(data, { detectFormat: true });

      expect(result).toEqual<SchemaObject>({
        type: 'string',
        format: 'uri',
      });
    });
  });

  describe('복합 시나리오', () => {
    it('복잡한 중첩 구조를 올바르게 추론해야 함', () => {
      const data = {
        id: 1,
        name: 'Product',
        tags: ['electronics', 'gadgets'],
        details: {
          price: 299.99,
          inStock: true,
          variants: [
            { color: 'red', size: 'M' },
            { color: 'blue', size: 'L' },
          ],
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          details: {
            type: 'object',
            properties: {
              price: { type: 'number' },
              inStock: { type: 'boolean' },
              variants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    color: { type: 'string' },
                    size: { type: 'string' },
                  },
                  required: ['color', 'size'],
                },
              },
            },
            required: ['price', 'inStock', 'variants'],
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'tags', 'details', 'createdAt'],
      });
    });

    it('다양한 타입의 배열 항목을 병합해야 함', () => {
      const data = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane' },
        { id: 3, name: 'Bob', age: 30 },
      ];

      const result = inferSchema(data);

      expect(result).toEqual<SchemaObject>({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'number' },
          },
          required: ['id', 'name'],
        },
      });
    });
  });

  describe('옵션 처리', () => {
    it('inferInteger 옵션이 작동해야 함', () => {
      const data = { count: 42, price: 99.99 };

      const result = inferSchema(data, { inferInteger: true });

      expect(result.properties?.['count']).toEqual<SchemaObject>({
        type: 'integer',
      });
      expect(result.properties?.['price']).toEqual<SchemaObject>({
        type: 'number',
      });
    });

    it('detectFormat 옵션이 작동해야 함', () => {
      const data = {
        email: 'test@example.com',
        website: 'https://example.com',
        name: 'John',
      };

      const result = inferSchema(data, { detectFormat: true });

      expect(result.properties?.['email']).toHaveProperty('format', 'email');
      expect(result.properties?.['website']).toHaveProperty('format', 'uri');
      expect(result.properties?.['name']).not.toHaveProperty('format');
    });
  });
});
