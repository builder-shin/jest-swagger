/**
 * NestJS 통합 예제
 *
 * NestJS 컨트롤러에서 jest-swagger 데코레이터를 사용하는 방법을 보여주는 예제
 */

import 'reflect-metadata';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  createNestJSDocument,
} from '../src';

// 사용자 DTO 스키마
const CreateUserSchema = {
  type: 'object' as const,
  required: ['name', 'email'],
  properties: {
    name: { type: 'string' as const, description: '사용자 이름' },
    email: { type: 'string' as const, format: 'email', description: '이메일 주소' },
  },
};

const UserSchema = {
  type: 'object' as const,
  properties: {
    id: { type: 'string' as const, description: '사용자 ID' },
    name: { type: 'string' as const, description: '사용자 이름' },
    email: { type: 'string' as const, description: '이메일 주소' },
  },
};

/**
 * 사용자 컨트롤러
 */
@ApiTags('users')
class UserController {
  /**
   * 사용자 목록 조회
   */
  @ApiOperation({ summary: '사용자 목록 조회', description: '모든 사용자 목록을 조회합니다' })
  @ApiQuery({ name: 'page', description: '페이지 번호', required: false })
  @ApiQuery({ name: 'limit', description: '페이지 크기', required: false })
  @ApiResponse({
    status: 200,
    description: '성공',
    schema: {
      type: 'array',
      items: UserSchema,
    },
  })
  async getUsers() {
    return [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];
  }

  /**
   * 사용자 조회
   */
  @ApiOperation({ summary: '사용자 조회', description: 'ID로 사용자를 조회합니다' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '성공',
    schema: UserSchema,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
  })
  async getUserById(id: string) {
    return { id, name: 'John Doe', email: 'john@example.com' };
  }

  /**
   * 사용자 생성
   */
  @ApiOperation({ summary: '사용자 생성', description: '새로운 사용자를 생성합니다' })
  @ApiBody({
    description: '사용자 정보',
    schema: CreateUserSchema,
  })
  @ApiResponse({
    status: 201,
    description: '생성됨',
    schema: UserSchema,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
  })
  async createUser(dto: any) {
    return { id: '3', ...dto };
  }

  /**
   * 사용자 수정
   */
  @ApiOperation({ summary: '사용자 수정', description: '사용자 정보를 수정합니다' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiBody({
    description: '수정할 사용자 정보',
    schema: CreateUserSchema,
  })
  @ApiResponse({
    status: 200,
    description: '성공',
    schema: UserSchema,
  })
  async updateUser(id: string, dto: any) {
    return { id, ...dto };
  }

  /**
   * 사용자 삭제
   */
  @ApiOperation({ summary: '사용자 삭제', description: '사용자를 삭제합니다' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 204,
    description: '삭제됨',
  })
  async deleteUser(id: string) {
    return;
  }
}

// OpenAPI 문서 생성
const document = createNestJSDocument({
  title: 'NestJS API',
  version: '1.0.0',
  description: 'NestJS API 문서 예제',
  routes: [
    {
      path: '/users',
      method: 'GET',
      controller: UserController,
      handler: 'getUsers',
    },
    {
      path: '/users/:id',
      method: 'GET',
      controller: UserController,
      handler: 'getUserById',
    },
    {
      path: '/users',
      method: 'POST',
      controller: UserController,
      handler: 'createUser',
    },
    {
      path: '/users/:id',
      method: 'PUT',
      controller: UserController,
      handler: 'updateUser',
    },
    {
      path: '/users/:id',
      method: 'DELETE',
      controller: UserController,
      handler: 'deleteUser',
    },
  ],
});

console.log('OpenAPI 문서 생성 완료:');
console.log(JSON.stringify(document, null, 2));

export { UserController, document };
