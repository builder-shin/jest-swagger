import type { Config } from 'jest';

const config: Config = {
  // ts-jest 프리셋 사용
  preset: 'ts-jest',

  // 테스트 환경
  testEnvironment: 'node',

  // 루트 디렉토리
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // 테스트 파일 패턴
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // 모듈 경로 매핑 (tsconfig와 일치)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // 변환 설정
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        noUnusedLocals: false,
        noUnusedParameters: false
      }
    }]
  },

  // 커버리지 설정
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // 커버리지 임계값 (95% 이상)
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },

  // 테스트 타임아웃 (밀리초)
  testTimeout: 10000,

  // 상세 출력
  verbose: true,

  // 캐시 설정
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // 글로벌 설정 파일
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 모듈 파일 확장자
  moduleFileExtensions: ['ts', 'js', 'json'],

  // 경고 무시 패턴
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // 클리어 목(Clear mocks) 자동 설정
  clearMocks: true,

  // 각 테스트 후 목(mock) 초기화
  resetMocks: true,

  // 각 테스트 후 모듈 초기화
  resetModules: false,

  // 최대 워커 수 (병렬 실행)
  maxWorkers: '50%',

  // 에러 출력
  errorOnDeprecated: true
};

export default config;
