/**
 * 기본 사용법 예제
 * 간단한 사용자 API 테스트
 */

import { Api, Path, Parameter, Response } from 'jest-swagger';

describe('사용자 API - 기본 예제', () => {
  /**
   * 사용자 생성 API
   */
  @Api({
    tags: ['users'],
    summary: '사용자 생성',
    description: '새로운 사용자를 생성합니다.',
  })
  @Path('post', '/users')
  @Response(201, {
    description: '사용자가 성공적으로 생성됨',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['id', 'name', 'email'],
          properties: {
            id: {
              type: 'number',
              description: '사용자 ID',
            },
            name: {
              type: 'string',
              description: '사용자 이름',
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: 'string',
              description: '이메일 주소',
              format: 'email',
            },
            createdAt: {
              type: 'string',
              description: '생성 시각',
              format: 'date-time',
            },
          },
        },
        example: {
          id: 1,
          name: '홍길동',
          email: 'hong@example.com',
          createdAt: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @Response(400, {
    description: '잘못된 요청',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '에러 메시지',
            },
          },
        },
      },
    },
  })
  test('사용자를 생성할 수 있어야 함', async () => {
    const newUser = {
      name: '홍길동',
      email: 'hong@example.com',
    };

    // 실제 테스트 로직
    // const response = await createUser(newUser);
    // expect(response.status).toBe(201);

    // 모의 테스트
    expect(newUser.name).toBe('홍길동');
    expect(newUser.email).toBe('hong@example.com');
  });

  /**
   * 사용자 조회 API
   */
  @Api({
    tags: ['users'],
    summary: '사용자 조회',
    description: 'ID로 특정 사용자를 조회합니다.',
  })
  @Path('get', '/users/{id}')
  @Parameter({
    name: 'id',
    in: 'path',
    description: '사용자 ID',
    required: true,
    schema: {
      type: 'number',
      minimum: 1,
    },
    example: 1,
  })
  @Response(200, {
    description: '성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
        example: {
          id: 1,
          name: '홍길동',
          email: 'hong@example.com',
        },
      },
    },
  })
  @Response(404, {
    description: '사용자를 찾을 수 없음',
  })
  test('ID로 사용자를 조회할 수 있어야 함', async () => {
    const userId = 1;

    // 실제 테스트 로직
    // const response = await getUser(userId);
    // expect(response.status).toBe(200);

    // 모의 테스트
    expect(userId).toBe(1);
  });

  /**
   * 사용자 목록 조회 API
   */
  @Api({
    tags: ['users'],
    summary: '사용자 목록 조회',
    description: '페이지네이션된 사용자 목록을 조회합니다.',
  })
  @Path('get', '/users')
  @Parameter({
    name: 'page',
    in: 'query',
    description: '페이지 번호',
    schema: {
      type: 'number',
      minimum: 1,
      default: 1,
    },
    example: 1,
  })
  @Parameter({
    name: 'limit',
    in: 'query',
    description: '페이지 당 항목 수',
    schema: {
      type: 'number',
      minimum: 1,
      maximum: 100,
      default: 10,
    },
    example: 10,
  })
  @Response(200, {
    description: '성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
            total: {
              type: 'number',
              description: '전체 항목 수',
            },
            page: {
              type: 'number',
              description: '현재 페이지',
            },
            limit: {
              type: 'number',
              description: '페이지 당 항목 수',
            },
          },
        },
        example: {
          data: [
            { id: 1, name: '홍길동', email: 'hong@example.com' },
            { id: 2, name: '김철수', email: 'kim@example.com' },
          ],
          total: 100,
          page: 1,
          limit: 10,
        },
      },
    },
  })
  test('페이지네이션된 사용자 목록을 조회할 수 있어야 함', async () => {
    const page = 1;
    const limit = 10;

    // 실제 테스트 로직
    // const response = await getUsers({ page, limit });
    // expect(response.status).toBe(200);

    // 모의 테스트
    expect(page).toBe(1);
    expect(limit).toBe(10);
  });

  /**
   * 사용자 수정 API
   */
  @Api({
    tags: ['users'],
    summary: '사용자 수정',
    description: '사용자 정보를 수정합니다.',
  })
  @Path('put', '/users/{id}')
  @Parameter({
    name: 'id',
    in: 'path',
    description: '사용자 ID',
    required: true,
    schema: { type: 'number' },
    example: 1,
  })
  @Response(200, {
    description: '성공',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @Response(404, {
    description: '사용자를 찾을 수 없음',
  })
  test('사용자 정보를 수정할 수 있어야 함', async () => {
    const userId = 1;
    const updateData = {
      name: '홍길동2',
    };

    // 모의 테스트
    expect(updateData.name).toBe('홍길동2');
  });

  /**
   * 사용자 삭제 API
   */
  @Api({
    tags: ['users'],
    summary: '사용자 삭제',
    description: '사용자를 삭제합니다.',
  })
  @Path('delete', '/users/{id}')
  @Parameter({
    name: 'id',
    in: 'path',
    description: '사용자 ID',
    required: true,
    schema: { type: 'number' },
    example: 1,
  })
  @Response(204, {
    description: '성공적으로 삭제됨',
  })
  @Response(404, {
    description: '사용자를 찾을 수 없음',
  })
  test('사용자를 삭제할 수 있어야 함', async () => {
    const userId = 1;

    // 모의 테스트
    expect(userId).toBe(1);
  });
});
