/**
 * 컴포넌트 레지스트리 테스트
 */

import { ComponentRegistry } from '../../src/builders/component-registry';
import type { OpenAPISchema, ResponseObject, ParameterObject } from '../../src/types/openapi.types';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('스키마 관리', () => {
    it('스키마를 등록하고 조회할 수 있어야 한다', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      registry.registerSchema('User', schema);
      const retrieved = registry.getSchema('User');

      expect(retrieved).toEqual(schema);
    });

    it('존재하지 않는 스키마는 undefined를 반환해야 한다', () => {
      expect(registry.getSchema('NonExistent')).toBeUndefined();
    });

    it('스키마 존재 여부를 확인할 수 있어야 한다', () => {
      const schema: OpenAPISchema = { type: 'string' };
      registry.registerSchema('Test', schema);

      expect(registry.hasSchema('Test')).toBe(true);
      expect(registry.hasSchema('NonExistent')).toBe(false);
    });

    it('스키마를 삭제할 수 있어야 한다', () => {
      const schema: OpenAPISchema = { type: 'string' };
      registry.registerSchema('Test', schema);

      expect(registry.deleteSchema('Test')).toBe(true);
      expect(registry.hasSchema('Test')).toBe(false);
    });

    it('모든 스키마를 조회할 수 있어야 한다', () => {
      registry.registerSchema('User', { type: 'object' });
      registry.registerSchema('Product', { type: 'object' });

      const allSchemas = registry.getAllSchemas();

      expect(Object.keys(allSchemas)).toHaveLength(2);
      expect(allSchemas['User']).toBeDefined();
      expect(allSchemas['Product']).toBeDefined();
    });
  });

  describe('응답 관리', () => {
    it('응답을 등록하고 조회할 수 있어야 한다', () => {
      const response: ResponseObject = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      };

      registry.registerResponse('Success', response);
      const retrieved = registry.getResponse('Success');

      expect(retrieved).toEqual(response);
    });

    it('모든 응답을 조회할 수 있어야 한다', () => {
      registry.registerResponse('Success', { description: 'Success' });
      registry.registerResponse('Error', { description: 'Error' });

      const allResponses = registry.getAllResponses();

      expect(Object.keys(allResponses)).toHaveLength(2);
    });
  });

  describe('파라미터 관리', () => {
    it('파라미터를 등록하고 조회할 수 있어야 한다', () => {
      const parameter: ParameterObject = {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      };

      registry.registerParameter('IdParam', parameter);
      const retrieved = registry.getParameter('IdParam');

      expect(retrieved).toEqual(parameter);
    });

    it('모든 파라미터를 조회할 수 있어야 한다', () => {
      registry.registerParameter('Id', { name: 'id', in: 'path' });
      registry.registerParameter('Name', { name: 'name', in: 'query' });

      const allParameters = registry.getAllParameters();

      expect(Object.keys(allParameters)).toHaveLength(2);
    });
  });

  describe('참조 생성', () => {
    it('스키마 참조를 생성할 수 있어야 한다', () => {
      const ref = registry.createSchemaReference('User');

      expect(ref).toEqual({
        $ref: '#/components/schemas/User',
      });
    });

    it('응답 참조를 생성할 수 있어야 한다', () => {
      const ref = registry.createResponseReference('Success');

      expect(ref).toEqual({
        $ref: '#/components/responses/Success',
      });
    });

    it('파라미터 참조를 생성할 수 있어야 한다', () => {
      const ref = registry.createParameterReference('IdParam');

      expect(ref).toEqual({
        $ref: '#/components/parameters/IdParam',
      });
    });
  });

  describe('OpenAPI 컴포넌트 변환', () => {
    it('모든 컴포넌트를 OpenAPI 포맷으로 변환할 수 있어야 한다', () => {
      registry.registerSchema('User', { type: 'object' });
      registry.registerResponse('Success', { description: 'Success' });
      registry.registerParameter('IdParam', { name: 'id', in: 'path' });

      const components = registry.toOpenAPIComponents();

      expect(components.schemas).toBeDefined();
      expect(components.responses).toBeDefined();
      expect(components.parameters).toBeDefined();
    });

    it('빈 레지스트리는 빈 객체를 반환해야 한다', () => {
      const components = registry.toOpenAPIComponents();

      expect(components).toEqual({});
    });
  });

  describe('레지스트리 관리', () => {
    it('레지스트리를 초기화할 수 있어야 한다', () => {
      registry.registerSchema('User', { type: 'object' });
      registry.registerResponse('Success', { description: 'Success' });

      registry.clear();

      expect(registry.getComponentCount()).toBe(0);
      expect(registry.getSchema('User')).toBeUndefined();
      expect(registry.getResponse('Success')).toBeUndefined();
    });

    it('컴포넌트 개수를 조회할 수 있어야 한다', () => {
      expect(registry.getComponentCount()).toBe(0);

      registry.registerSchema('User', { type: 'object' });
      expect(registry.getComponentCount()).toBe(1);

      registry.registerResponse('Success', { description: 'Success' });
      expect(registry.getComponentCount()).toBe(2);

      expect(registry.getComponentCount('schemas')).toBe(1);
      expect(registry.getComponentCount('responses')).toBe(1);
    });
  });
});
