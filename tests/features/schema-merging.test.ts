/**
 * SchemaMerger 테스트
 *
 * 여러 스키마를 병합하여 완전한 스키마를 생성하는 기능 검증
 */

import { SchemaMerger } from '../../src/validation/schema-merger';
import { SchemaObject } from '../../src/types/openapi.types';

describe('SchemaMerger', () => {
  describe('merge()', () => {
    /**
     * Test Case 4.1.1: Merge Multiple Response Schemas
     * 서로 다른 필드를 가진 3개의 응답 스키마를 병합
     */
    it('should merge multiple response schemas with different fields', () => {
      // 각기 다른 필드를 가진 3개의 스키마
      const schema1: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
        required: ['id', 'name'],
      };

      const schema2: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          email: { type: 'string' },
        },
        required: ['id', 'email'],
      };

      const schema3: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          age: { type: 'number' },
        },
        required: ['id', 'age'],
      };

      const merged = SchemaMerger.merge([schema1, schema2, schema3]);

      // 모든 필드가 포함되어야 함
      expect(merged.properties).toHaveProperty('id');
      expect(merged.properties).toHaveProperty('name');
      expect(merged.properties).toHaveProperty('email');
      expect(merged.properties).toHaveProperty('age');

      // id만 모든 스키마에서 required이므로 병합된 스키마에서도 required
      expect(merged.required).toEqual(['id']);
    });

    /**
     * Test Case 4.1.1-2: 공통 필드와 선택적 필드 확인
     */
    it('should distinguish common required fields from optional fields', () => {
      const schema1: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          status: { type: 'string' },
        },
        required: ['id', 'name', 'status'],
      };

      const schema2: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
        required: ['id', 'name'],
      };

      const merged = SchemaMerger.merge([schema1, schema2]);

      // 모든 필드 포함
      expect(Object.keys(merged.properties || {})).toHaveLength(4);
      expect(merged.properties).toHaveProperty('id');
      expect(merged.properties).toHaveProperty('name');
      expect(merged.properties).toHaveProperty('status');
      expect(merged.properties).toHaveProperty('email');

      // id와 name만 공통 required
      expect(merged.required).toEqual(['id', 'name']);
    });

    /**
     * Test Case 4.1.2: Handle Empty Schema Array
     * 빈 배열 입력 시 기본 객체 스키마 반환
     */
    it('should return default object schema for empty array', () => {
      const merged = SchemaMerger.merge([]);

      expect(merged).toEqual({
        type: 'object',
        properties: {},
      });
    });

    /**
     * Test Case 4.1.3: Single Schema
     * 단일 스키마 입력 시 그대로 반환
     */
    it('should return the same schema for single schema input', () => {
      const schema: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
        required: ['id'],
      };

      const merged = SchemaMerger.merge([schema]);

      expect(merged).toEqual(schema);
    });

    /**
     * Test Case 4.1.4: Nested Object Schema Merge
     * 중첩된 객체 스키마 병합
     */
    it('should merge nested object schemas', () => {
      const schema1: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        required: ['id', 'user'],
      };

      const schema2: SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          user: {
            type: 'object',
            properties: {
              email: { type: 'string' },
            },
            required: ['email'],
          },
        },
        required: ['id', 'user'],
      };

      const merged = SchemaMerger.merge([schema1, schema2]);

      // 중첩된 객체도 병합되어야 함
      expect(merged.properties?.['user']).toBeDefined();
      const userSchema = merged.properties?.['user'] as SchemaObject;
      expect(userSchema.properties).toHaveProperty('name');
      expect(userSchema.properties).toHaveProperty('email');

      // user 객체는 두 스키마 모두에서 required이므로 병합 후에도 required
      expect(merged.required).toContain('id');
      expect(merged.required).toContain('user');
    });

    /**
     * Test Case 4.1.5: Array Schema Merge
     * 배열 스키마 병합
     */
    it('should merge array schemas', () => {
      const schema1: SchemaObject = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
              },
            },
          },
        },
      };

      const schema2: SchemaObject = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      };

      const merged = SchemaMerger.merge([schema1, schema2]);

      // 배열의 items 스키마도 병합되어야 함
      const itemsSchema = merged.properties?.['items'] as SchemaObject;
      expect(itemsSchema.type).toBe('array');

      const itemSchema = itemsSchema.items as SchemaObject;
      expect(itemSchema.properties).toHaveProperty('id');
      expect(itemSchema.properties).toHaveProperty('name');
    });

    /**
     * Test Case 4.1.6: Type Conflict with oneOf
     * 타입 충돌 시 oneOf 사용
     */
    it('should use oneOf for type conflicts', () => {
      const schema1: SchemaObject = {
        type: 'object',
        properties: {
          value: { type: 'string' },
        },
      };

      const schema2: SchemaObject = {
        type: 'object',
        properties: {
          value: { type: 'number' },
        },
      };

      const merged = SchemaMerger.merge([schema1, schema2]);

      // 타입 충돌 시 oneOf 사용
      const valueSchema = merged.properties?.['value'] as SchemaObject;
      expect(valueSchema.oneOf).toBeDefined();
      expect(valueSchema.oneOf).toHaveLength(2);
    });

    /**
     * Test Case 4.1.7: No Required Fields in Any Schema
     * required 필드가 없는 경우
     */
    it('should handle schemas without required fields', () => {
      const schema1: SchemaObject = {
        type: 'object',
        properties: {
          field1: { type: 'string' },
        },
      };

      const schema2: SchemaObject = {
        type: 'object',
        properties: {
          field2: { type: 'string' },
        },
      };

      const merged = SchemaMerger.merge([schema1, schema2]);

      // required 필드가 없어야 함 (또는 빈 배열)
      expect(merged.required).toBeUndefined();
    });

    /**
     * Test Case 4.1.8: Primitive Type Schemas
     * 객체가 아닌 기본 타입 스키마
     */
    it('should handle primitive type schemas', () => {
      const schema1: SchemaObject = {
        type: 'string',
      };

      const schema2: SchemaObject = {
        type: 'string',
      };

      const merged = SchemaMerger.merge([schema1, schema2]);

      // 기본 타입은 첫 번째 스키마 반환
      expect(merged).toEqual(schema1);
    });
  });
});
