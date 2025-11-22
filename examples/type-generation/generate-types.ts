/**
 * 타입 생성 예제
 * OpenAPI 문서에서 TypeScript 타입 자동 생성
 */

import { TypeGenerator } from 'jest-swagger';
import type { OpenAPIDocument } from 'jest-swagger';

async function main() {
  // 예제 OpenAPI 문서
  const document: OpenAPIDocument = {
    openapi: '3.0.0',
    info: {
      title: '사용자 관리 API',
      version: '1.0.0',
      description: '사용자 생성, 조회, 수정, 삭제 API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '개발 서버',
      },
    ],
    paths: {
      '/users': {
        get: {
          summary: '사용자 목록 조회',
          responses: {
            '200': {
              description: '성공',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: '사용자 생성',
          responses: {
            '201': {
              description: '생성됨',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User',
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
          required: ['id', 'name', 'email'],
          properties: {
            id: {
              type: 'number',
              description: '사용자 ID',
              readOnly: true,
            },
            name: {
              type: 'string',
              description: '사용자 이름',
              minLength: 2,
              maxLength: 50,
              pattern: '^[a-zA-Z가-힣]+$',
            },
            email: {
              type: 'string',
              description: '이메일 주소',
              format: 'email',
            },
            role: {
              $ref: '#/components/schemas/UserRole',
            },
            status: {
              $ref: '#/components/schemas/UserStatus',
            },
            profile: {
              $ref: '#/components/schemas/UserProfile',
            },
            createdAt: {
              type: 'string',
              description: '생성 시각',
              format: 'date-time',
              readOnly: true,
            },
            updatedAt: {
              type: 'string',
              description: '수정 시각',
              format: 'date-time',
              readOnly: true,
            },
          },
        },
        UserRole: {
          type: 'string',
          enum: ['admin', 'user', 'guest'],
          description: '사용자 역할',
        },
        UserStatus: {
          type: 'string',
          enum: ['active', 'inactive', 'pending'],
          description: '사용자 상태',
        },
        UserProfile: {
          type: 'object',
          properties: {
            bio: {
              type: 'string',
              description: '자기소개',
              maxLength: 500,
            },
            avatar: {
              type: 'string',
              description: '프로필 이미지 URL',
              format: 'uri',
            },
            website: {
              type: 'string',
              description: '웹사이트',
              format: 'uri',
              nullable: true,
            },
            socialLinks: {
              type: 'object',
              description: '소셜 미디어 링크',
              properties: {
                twitter: { type: 'string' },
                github: { type: 'string' },
                linkedin: { type: 'string' },
              },
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
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
            role: {
              $ref: '#/components/schemas/UserRole',
            },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
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
            status: {
              $ref: '#/components/schemas/UserStatus',
            },
          },
        },
        PaginatedUsers: {
          type: 'object',
          required: ['data', 'total', 'page', 'limit'],
          properties: {
            data: {
              type: 'array',
              description: '사용자 목록',
              items: {
                $ref: '#/components/schemas/User',
              },
            },
            total: {
              type: 'number',
              description: '전체 항목 수',
              minimum: 0,
            },
            page: {
              type: 'number',
              description: '현재 페이지',
              minimum: 1,
            },
            limit: {
              type: 'number',
              description: '페이지 당 항목 수',
              minimum: 1,
              maximum: 100,
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: {
              type: 'string',
              description: '에러 코드',
            },
            message: {
              type: 'string',
              description: '에러 메시지',
            },
            details: {
              type: 'object',
              description: '추가 정보',
              nullable: true,
            },
          },
        },
      },
    },
  };

  // TypeScript 타입 생성
  const generator = new TypeGenerator();

  console.log('=== OpenAPI 문서에서 TypeScript 타입 생성 ===\n');

  // 개별 스키마 타입 생성 예제
  if (document.components?.schemas) {
    console.log('1. User 타입:');
    console.log(generator.generateType(document.components.schemas.User, 'User'));
    console.log('\n');

    console.log('2. UserRole 타입:');
    console.log(generator.generateType(document.components.schemas.UserRole, 'UserRole'));
    console.log('\n');

    console.log('3. UserStatus 타입:');
    console.log(generator.generateType(document.components.schemas.UserStatus, 'UserStatus'));
    console.log('\n');
  }

  // 전체 문서에서 타입 생성
  console.log('4. 전체 타입 정의:\n');
  const allTypes = generator.generateFromDocument(document);
  console.log(allTypes);

  // 파일로 저장
  console.log('\n5. 타입을 파일로 저장...');
  await generator.generateToFile(document, './examples/type-generation/api.generated.ts');
  console.log('✅ 타입이 ./examples/type-generation/api.generated.ts 파일로 저장되었습니다.\n');

  // 생성된 타입 사용 예제
  console.log('6. 생성된 타입 사용 예제:\n');
  console.log(`
import type { User, UserRole, CreateUserRequest } from './api.generated';

// 타입 안전한 사용자 생성
const newUser: CreateUserRequest = {
  name: '홍길동',
  email: 'hong@example.com',
  role: 'admin', // UserRole 타입으로 자동 완성
};

// 타입 안전한 사용자 정보
const user: User = {
  id: 1,
  name: '홍길동',
  email: 'hong@example.com',
  role: 'admin',
  status: 'active',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

// 컴파일 타임 타입 체크
function getUser(id: number): User {
  // ...
}

function createUser(data: CreateUserRequest): User {
  // ...
}
  `);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}

export { main };
