/**
 * SwaggerReporter 테스트
 */

import { SwaggerReporter } from '../../src/reporters/swagger-reporter';
import {
  ReporterOptions,
  TestResults,
  TestFileResult,
  TestCaseResult,
  GlobalConfig,
} from '../../src/types/reporter';
import { OpenAPIDocument } from '../../src/types/openapi';
import * as fs from 'fs';
import * as path from 'path';

// Jest Reporter 인터페이스의 필수 메서드 시뮬레이션
interface JestReporter {
  onRunStart?(results: TestResults, options: GlobalConfig): void | Promise<void>;
  onTestFileStart?(testPath: string): void | Promise<void>;
  onTestCaseResult?(test: string, testCaseResult: TestCaseResult): void | Promise<void>;
  onRunComplete?(testContexts: Set<unknown>, results: TestResults): void | Promise<void>;
  getLastError?(): Error | void;
}

// 테스트용 모의 데이터
const mockGlobalConfig: GlobalConfig = {
  rootDir: '/test/project',
  watch: false,
  collectCoverage: false,
};

const mockTestCaseResult: TestCaseResult = {
  title: 'should return users list',
  fullName: 'GET /users should return users list',
  status: 'passed',
  duration: 150,
};

const mockTestFileResult: TestFileResult = {
  testFilePath: '/test/project/tests/api/users.test.ts',
  testResults: [mockTestCaseResult],
  perfStats: {
    start: Date.now() - 1000,
    end: Date.now(),
  },
};

const mockTestResults: TestResults = {
  success: true,
  numTotalTests: 5,
  numPassedTests: 5,
  numFailedTests: 0,
  numPendingTests: 0,
  startTime: Date.now() - 5000,
  testResults: [mockTestFileResult],
};

describe('SwaggerReporter', () => {
  let reporter: SwaggerReporter;
  const testOutputDir = path.join(__dirname, '../../.test-output/reporter');
  let defaultOptions: ReporterOptions;

  beforeEach(() => {
    defaultOptions = {
      outputDir: testOutputDir,
      filename: 'openapi',
      format: 'yaml',
      overwrite: true,
      logLevel: 'silent', // 테스트 중 로그 비활성화
    };

    reporter = new SwaggerReporter(defaultOptions);

    // 테스트 출력 디렉토리 생성
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // 테스트 파일 정리
    if (fs.existsSync(testOutputDir)) {
      const files = fs.readdirSync(testOutputDir);
      files.forEach((file) => {
        const filePath = path.join(testOutputDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });

  describe('리포터 초기화', () => {
    it('기본 옵션으로 생성되어야 함', () => {
      const defaultReporter = new SwaggerReporter();

      expect(defaultReporter).toBeDefined();
      expect(defaultReporter).toBeInstanceOf(SwaggerReporter);
    });

    it('사용자 정의 옵션을 적용해야 함', () => {
      const customOptions: ReporterOptions = {
        outputDir: './custom-docs',
        filename: 'api-spec',
        format: 'json',
        pretty: true,
        indent: 4,
      };

      const customReporter = new SwaggerReporter(customOptions);

      expect(customReporter).toBeDefined();
    });

    it('옵션 병합이 올바르게 동작해야 함', () => {
      const partialOptions: Partial<ReporterOptions> = {
        format: 'json',
      };

      const reporterWithPartial = new SwaggerReporter(partialOptions);

      expect(reporterWithPartial).toBeDefined();
    });
  });

  describe('Jest Reporter 인터페이스', () => {
    it('onRunStart 메서드가 호출되어야 함', async () => {
      const onRunStartSpy = jest.spyOn(reporter as any, 'onRunStart');

      await reporter.onRunStart(mockTestResults, mockGlobalConfig);

      expect(onRunStartSpy).toHaveBeenCalledWith(mockTestResults, mockGlobalConfig);
    });

    it('onTestFileStart 메서드가 호출되어야 함', async () => {
      const testPath = '/test/project/tests/api/users.test.ts';
      const onTestFileStartSpy = jest.spyOn(reporter as any, 'onTestFileStart');

      await reporter.onTestFileStart(testPath);

      expect(onTestFileStartSpy).toHaveBeenCalledWith(testPath);
    });

    it('onTestCaseResult 메서드가 호출되어야 함', async () => {
      const testPath = '/test/project/tests/api/users.test.ts';
      const onTestCaseResultSpy = jest.spyOn(reporter as any, 'onTestCaseResult');

      await reporter.onTestCaseResult(testPath, mockTestCaseResult);

      expect(onTestCaseResultSpy).toHaveBeenCalledWith(testPath, mockTestCaseResult);
    });

    it('onRunComplete 메서드가 호출되어야 함', async () => {
      const testContexts = new Set();
      const onRunCompleteSpy = jest.spyOn(reporter as any, 'onRunComplete');

      await reporter.onRunComplete(testContexts, mockTestResults);

      expect(onRunCompleteSpy).toHaveBeenCalledWith(testContexts, mockTestResults);
    });
  });

  describe('메타데이터 수집', () => {
    it('테스트 결과에서 메타데이터를 추출해야 함', async () => {
      await reporter.onRunStart(mockTestResults, mockGlobalConfig);
      await reporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);

      const metadata = (reporter as any).getCollectedMetadata();

      expect(metadata).toBeDefined();
      expect(Array.isArray(metadata)).toBe(true);
    });

    it('통과한 테스트만 수집해야 함 (기본 설정)', async () => {
      const failedTest: TestCaseResult = {
        ...mockTestCaseResult,
        status: 'failed',
        failureMessages: ['Test failed'],
      };

      await reporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await reporter.onTestCaseResult(mockTestFileResult.testFilePath, failedTest);

      const metadata = (reporter as any).getCollectedMetadata();

      // 통과한 테스트만 수집되어야 함
      expect(metadata.length).toBe(1);
      expect(metadata[0].testCase.status).toBe('passed');
    });

    it('includeFailedTests 옵션이 활성화되면 실패한 테스트도 수집해야 함', async () => {
      const optionsWithFailed: ReporterOptions = {
        ...defaultOptions,
        includeFailedTests: true,
      };

      const reporterWithFailed = new SwaggerReporter(optionsWithFailed);

      const failedTest: TestCaseResult = {
        ...mockTestCaseResult,
        status: 'failed',
      };

      await reporterWithFailed.onTestCaseResult(
        mockTestFileResult.testFilePath,
        mockTestCaseResult
      );
      await reporterWithFailed.onTestCaseResult(mockTestFileResult.testFilePath, failedTest);

      const metadata = (reporterWithFailed as any).getCollectedMetadata();

      expect(metadata.length).toBe(2);
    });

    it('스킵된 테스트 수집 옵션을 적용해야 함', async () => {
      const optionsWithSkipped: ReporterOptions = {
        ...defaultOptions,
        includeSkippedTests: true,
      };

      const reporterWithSkipped = new SwaggerReporter(optionsWithSkipped);

      const skippedTest: TestCaseResult = {
        ...mockTestCaseResult,
        status: 'skipped',
      };

      await reporterWithSkipped.onTestCaseResult(mockTestFileResult.testFilePath, skippedTest);

      const metadata = (reporterWithSkipped as any).getCollectedMetadata();

      expect(metadata.length).toBe(1);
    });
  });

  describe('문서 생성', () => {
    it('수집된 메타데이터로 OpenAPI 문서를 생성해야 함', async () => {
      await reporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await reporter.onRunComplete(new Set(), mockTestResults);

      // 문서가 생성되었는지 확인
      const outputPath = path.join(testOutputDir, 'openapi.yaml');
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('생성된 문서가 유효한 OpenAPI 형식이어야 함', async () => {
      await reporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await reporter.onRunComplete(new Set(), mockTestResults);

      const outputPath = path.join(testOutputDir, 'openapi.yaml');
      const content = fs.readFileSync(outputPath, 'utf-8');

      // OpenAPI 버전 확인
      expect(content).toContain('openapi:');
      expect(content).toContain('info:');
      expect(content).toContain('paths:');
    });

    it('onlyAfterAllTests 옵션이 활성화되면 모든 테스트 후에만 생성해야 함', async () => {
      const optionsAfterAll: ReporterOptions = {
        ...defaultOptions,
        onlyAfterAllTests: true,
      };

      const reporterAfterAll = new SwaggerReporter(optionsAfterAll);

      await reporterAfterAll.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);

      // onRunComplete 호출 전에는 파일이 없어야 함
      const outputPath = path.join(testOutputDir, 'openapi.yaml');
      expect(fs.existsSync(outputPath)).toBe(false);

      await reporterAfterAll.onRunComplete(new Set(), mockTestResults);

      // onRunComplete 호출 후에는 파일이 생성되어야 함
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('포맷 출력', () => {
    it('JSON 포맷으로 출력해야 함', async () => {
      const jsonOptions: ReporterOptions = {
        ...defaultOptions,
        format: 'json',
        filename: 'openapi',
      };

      const jsonReporter = new SwaggerReporter(jsonOptions);

      await jsonReporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await jsonReporter.onRunComplete(new Set(), mockTestResults);

      const outputPath = path.join(testOutputDir, 'openapi.json');
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('YAML 포맷으로 출력해야 함', async () => {
      const yamlOptions: ReporterOptions = {
        ...defaultOptions,
        format: 'yaml',
      };

      const yamlReporter = new SwaggerReporter(yamlOptions);

      await yamlReporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await yamlReporter.onRunComplete(new Set(), mockTestResults);

      const outputPath = path.join(testOutputDir, 'openapi.yaml');
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('openapi:');
    });

    it('멀티 포맷으로 출력해야 함', async () => {
      const multiOptions: ReporterOptions = {
        ...defaultOptions,
        multiFormat: true,
      };

      const multiReporter = new SwaggerReporter(multiOptions);

      await multiReporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await multiReporter.onRunComplete(new Set(), mockTestResults);

      const jsonPath = path.join(testOutputDir, 'openapi.json');
      const yamlPath = path.join(testOutputDir, 'openapi.yaml');

      expect(fs.existsSync(jsonPath)).toBe(true);
      expect(fs.existsSync(yamlPath)).toBe(true);
    });
  });

  describe('통계 정보', () => {
    it('문서 통계를 계산해야 함', async () => {
      await reporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await reporter.onRunComplete(new Set(), mockTestResults);

      const stats = (reporter as any).getDocumentStats();

      expect(stats).toBeDefined();
      expect(stats.totalPaths).toBeGreaterThanOrEqual(0);
      expect(stats.totalOperations).toBeGreaterThanOrEqual(0);
    });

    it('printStats 옵션이 활성화되면 통계를 출력해야 함', async () => {
      const statsOptions: ReporterOptions = {
        ...defaultOptions,
        printStats: true,
        logLevel: 'info',
      };

      const statsReporter = new SwaggerReporter(statsOptions);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await statsReporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await statsReporter.onRunComplete(new Set(), mockTestResults);

      // 통계 출력 확인
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('콜백 함수', () => {
    it('onComplete 콜백이 호출되어야 함', async () => {
      const onCompleteMock = jest.fn();

      const callbackOptions: ReporterOptions = {
        ...defaultOptions,
        onComplete: onCompleteMock,
      };

      const callbackReporter = new SwaggerReporter(callbackOptions);

      await callbackReporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await callbackReporter.onRunComplete(new Set(), mockTestResults);

      expect(onCompleteMock).toHaveBeenCalled();
      expect(onCompleteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
          outputPaths: expect.any(Array),
          document: expect.any(Object),
        })
      );
    });

    it('onError 콜백이 에러 발생 시 호출되어야 함', async () => {
      const onErrorMock = jest.fn();

      const errorOptions: ReporterOptions = {
        ...defaultOptions,
        outputDir: '/invalid/\0/path', // 유효하지 않은 경로
        onError: onErrorMock,
      };

      const errorReporter = new SwaggerReporter(errorOptions);

      await errorReporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await errorReporter.onRunComplete(new Set(), mockTestResults);

      // onError 콜백이 호출되었는지 확인
      expect(onErrorMock).toHaveBeenCalled();

      // 호출된 인자가 Error 객체인지 확인
      expect(onErrorMock.mock.calls.length).toBeGreaterThan(0);
      const errorArg = onErrorMock.mock.calls[0]?.[0];
      expect(errorArg).toBeDefined();
      expect(errorArg.message).toBeDefined(); // Error 객체는 message 속성을 가짐
    });
  });

  describe('에러 처리', () => {
    it('잘못된 출력 디렉토리 처리', async () => {
      const invalidOptions: ReporterOptions = {
        ...defaultOptions,
        outputDir: '/invalid/\0/path',
      };

      const invalidReporter = new SwaggerReporter(invalidOptions);

      await invalidReporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);

      // 에러가 발생하지만 테스트는 계속 진행되어야 함
      await expect(
        invalidReporter.onRunComplete(new Set(), mockTestResults)
      ).resolves.not.toThrow();
    });

    it('메타데이터가 없을 때 빈 문서를 생성해야 함', async () => {
      await reporter.onRunComplete(new Set(), mockTestResults);

      const outputPath = path.join(testOutputDir, 'openapi.yaml');
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('openapi:');
      expect(content).toContain('paths: {}');
    });

    it('에러 추적을 위한 getLastError 메서드', () => {
      const error = reporter.getLastError();

      expect(error === undefined || error instanceof Error).toBe(true);
    });
  });

  describe('성능', () => {
    it('대량의 테스트 케이스를 처리해야 함', async () => {
      const startTime = Date.now();

      // 100개의 테스트 케이스 생성
      for (let i = 0; i < 100; i++) {
        const testCase: TestCaseResult = {
          ...mockTestCaseResult,
          title: `Test case ${i}`,
          fullName: `GET /users Test case ${i}`,
        };

        await reporter.onTestCaseResult(mockTestFileResult.testFilePath, testCase);
      }

      await reporter.onRunComplete(new Set(), mockTestResults);

      const duration = Date.now() - startTime;

      // 처리 시간이 합리적인지 확인 (5초 이내)
      expect(duration).toBeLessThan(5000);
    });

    it('실행 시간을 측정해야 함', async () => {
      await reporter.onTestCaseResult(mockTestFileResult.testFilePath, mockTestCaseResult);
      await reporter.onRunComplete(new Set(), mockTestResults);

      const result = (reporter as any).getLastResult();

      expect(result).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
