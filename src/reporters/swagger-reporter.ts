/**
 * SwaggerReporter 클래스
 * Jest Custom Reporter로 동작하여 테스트 실행 중 메타데이터를 수집하고
 * OpenAPI 문서를 자동으로 생성
 */

import * as path from 'path';
import { OpenAPIDocument } from '../types/openapi';
import {
  ReporterOptions,
  ReporterResult,
  TestResults,
  TestCaseResult,
  GlobalConfig,
  DocumentStats,
  OutputFormat,
} from '../types/reporter';
import { OutputFormatter } from './output-formatter';
import { metadataStorage } from '../types/metadata-storage';
import { ApiMetadata } from '../types/decorator.types';
import { inferSchema } from '../builders/schema-inference';
import { getFullPath } from '../decorators/path';

/**
 * SwaggerReporter
 * Jest Custom Reporter 인터페이스 구현
 */
export class SwaggerReporter {
  private options: Required<ReporterOptions>;
  private formatter: OutputFormatter;
  private collectedMetadata: Array<{
    testPath: string;
    testCase: TestCaseResult;
    timestamp: number;
  }> = [];
  private lastError?: Error;
  private lastResult?: ReporterResult;

  /**
   * 기본 옵션
   */
  private static readonly DEFAULT_OPTIONS: Required<
    Omit<ReporterOptions, 'transformers' | 'onComplete' | 'onError' | 'mergeSource' | 'jestContext'>
  > = {
    outputDir: './docs',
    filename: 'openapi',
    format: 'yaml',
    multiFormat: false,
    overwrite: true,
    pretty: true,
    indent: 2,
    logLevel: 'info',
    validate: true,
    strictValidation: false,
    printPath: true,
    printStats: false,
    collectMetadata: true,
    merge: false,
    onlyAfterAllTests: true,
    includeFailedTests: false,
    includeSkippedTests: false,
    includeTestMetadata: false,
  };

  constructor(options: Partial<ReporterOptions> = {}) {
    // 옵션 병합
    this.options = {
      ...SwaggerReporter.DEFAULT_OPTIONS,
      ...options,
    } as Required<ReporterOptions>;

    this.formatter = new OutputFormatter();
  }

  /**
   * Jest Reporter 인터페이스: 테스트 실행 시작
   */
  public onRunStart(_results: TestResults, _options: GlobalConfig): void {
    this.collectedMetadata = [];
    this.lastError = undefined;

    this.log('info', 'Jest-Swagger Reporter started');
  }

  /**
   * Jest Reporter 인터페이스: 테스트 파일 시작
   */
  public async onTestFileStart(_testPath: string): Promise<void> {
    // 필요시 구현
  }

  /**
   * Jest Reporter 인터페이스: 테스트 케이스 결과
   */
  public onTestCaseResult(test: string, testCaseResult: TestCaseResult): void {
    if (!this.options.collectMetadata) {
      return;
    }

    // 테스트 상태에 따른 필터링
    const shouldCollect = this.shouldCollectTest(testCaseResult);

    if (shouldCollect) {
      this.collectedMetadata.push({
        testPath: test,
        testCase: testCaseResult,
        timestamp: Date.now(),
      });

      this.log('debug', `Collected metadata for: ${testCaseResult.fullName}`);
    }
  }

  /**
   * Jest Reporter 인터페이스: 모든 테스트 완료
   */
  public async onRunComplete(_testContexts: Set<unknown>, results: TestResults): Promise<void> {
    try {
      // onlyAfterAllTests 옵션 확인
      if (this.options.onlyAfterAllTests) {
        await this.generateDocument(results);
      }
    } catch (error) {
      this.lastError = error as Error;
      this.log('error', `Failed to generate document: ${(error as Error).message}`);

      if (this.options.onError) {
        await this.options.onError(error as Error);
      }
    }
  }

  /**
   * Jest Reporter 인터페이스: 마지막 에러 조회
   */
  public getLastError(): Error | void {
    return this.lastError;
  }

  /**
   * 테스트 수집 여부 판단
   */
  private shouldCollectTest(testCase: TestCaseResult): boolean {
    const { status } = testCase;

    // 통과한 테스트는 항상 수집
    if (status === 'passed') {
      return true;
    }

    // 실패한 테스트
    if (status === 'failed' && this.options.includeFailedTests) {
      return true;
    }

    // 스킵된 테스트
    if ((status === 'skipped' || status === 'pending') && this.options.includeSkippedTests) {
      return true;
    }

    return false;
  }

  /**
   * OpenAPI 문서 생성
   */
  private async generateDocument(_results: TestResults): Promise<void> {
    const executionStartTime = Date.now();

    try {
      // 메타데이터로부터 OpenAPI 문서 생성
      const document = this.buildOpenAPIDocument();

      // 문서 통계 계산
      const stats = this.calculateStats(document);

      // 파일 출력
      const outputPaths = await this.writeOutput(document);

      // 실행 시간 계산
      const executionTime = Date.now() - executionStartTime;

      // 결과 생성
      const result: ReporterResult = {
        success: true,
        outputPaths,
        document,
        stats,
        executionTime,
      };

      this.lastResult = result;

      // 경로 출력
      if (this.options.printPath) {
        this.log('info', `\nOpenAPI document generated:`);
        outputPaths.forEach((p) => {
          this.log('info', `  - ${p}`);
        });
      }

      // 통계 출력
      if (this.options.printStats) {
        this.printStats(stats);
      }

      // 완료 콜백
      if (this.options.onComplete) {
        await this.options.onComplete(result);
      }
    } catch (error) {
      this.lastError = error as Error;
      this.log('error', `Failed to generate OpenAPI document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * OpenAPI 문서 빌드
   */
  private buildOpenAPIDocument(): OpenAPIDocument {
    // 기본 문서 구조
    const document: OpenAPIDocument = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'Generated by jest-swagger',
      },
      paths: {},
    };

    // 메타데이터로부터 경로 생성
    const apiMetadata = metadataStorage.getAll();

    // API 메타데이터를 OpenAPI 경로로 변환
    apiMetadata.forEach((metadata: ApiMetadata) => {
      const { path: apiPath, method, tags, summary, description, target, propertyKey } = metadata;

      // 전체 경로 조합 (basePath + path)
      const basePath = getFullPath(target);
      const fullPath = apiPath
        ? (basePath === '/' ? apiPath : `${basePath}${apiPath}`)
        : basePath;

      if (!document.paths[fullPath]) {
        document.paths[fullPath] = {};
      }

      const operation: any = {
        summary: summary || `${method.toUpperCase()} ${fullPath}`,
        operationId: this.generateOperationId(method, fullPath),
      };

      if (description) {
        operation.description = description;
      }

      if (tags && tags.length > 0) {
        operation.tags = tags;
      }

      // 응답 메타데이터 조회
      const responseMetadata = metadataStorage.getResponseMetadata(target, propertyKey);

      if (responseMetadata && responseMetadata.length > 0) {
        // 응답 메타데이터가 있으면 상세 응답 생성
        operation.responses = {};

        responseMetadata.forEach((respMeta) => {
          const statusCode = String(respMeta.statusCode);

          // 캡처된 실제 응답 조회
          const capturedResponse = metadataStorage.getCapturedResponse(
            target,
            propertyKey,
            respMeta.statusCode
          );

          // 스키마 결정: 데코레이터 스키마 또는 자동 추론
          let schema = respMeta.schema;
          if (!schema && capturedResponse && capturedResponse.body !== null) {
            try {
              schema = inferSchema(capturedResponse.body);
            } catch (error) {
              // 스키마 추론 실패시 무시
              this.log('debug', `Failed to infer schema for ${fullPath} ${statusCode}: ${error}`);
            }
          }

          // 응답 객체 생성
          const response: any = {
            description: respMeta.description || 'Success',
          };

          // content 생성 (스키마 또는 캡처된 응답이 있는 경우)
          if (schema || capturedResponse) {
            // contentType: 캡처된 응답에서 가져오거나 메타데이터 기본값 사용
            const mediaType =
              capturedResponse?.contentType || respMeta.mediaType || 'application/json';

            response.content = {
              [mediaType]: {
                schema: schema || { type: 'object' },
              },
            };

            // 여러 캡처된 응답이 있는지 확인
            const allCapturedResponses = metadataStorage.getAllCapturedResponses(
              target,
              propertyKey,
              respMeta.statusCode
            );

            if (allCapturedResponses && allCapturedResponses.length > 1) {
              // 여러 examples (복수형) 사용
              const examples: any = {};
              allCapturedResponses.forEach((capturedResp, index) => {
                examples[`example${index + 1}`] = {
                  value: capturedResp.body,
                  summary: `Example ${index + 1} (captured at ${new Date(
                    capturedResp.timestamp
                  ).toISOString()})`,
                };
              });
              response.content[mediaType].examples = examples;
            } else if (capturedResponse && capturedResponse.body !== null) {
              // 단일 응답은 example (단수형) 사용
              response.content[mediaType].example = capturedResponse.body;
            }
          }

          operation.responses[statusCode] = response;
        });
      } else {
        // 응답 메타데이터가 없으면 기본 응답 설정
        operation.responses = {
          '200': {
            description: 'Success',
          },
        };
      }

      (document.paths[fullPath] as any)[method] = operation;
    });

    return document;
  }

  /**
   * Operation ID 생성
   */
  private generateOperationId(method: string, path: string): string {
    // /users/{id} -> getUsersById
    const parts = path
      .split('/')
      .filter((p) => p)
      .map((p) => {
        if (p.startsWith('{') && p.endsWith('}')) {
          return 'By' + p.slice(1, -1).charAt(0).toUpperCase() + p.slice(2, -1);
        }
        return p.charAt(0).toUpperCase() + p.slice(1);
      });

    return method + parts.join('');
  }

  /**
   * 문서 통계 계산
   */
  private calculateStats(document: OpenAPIDocument): DocumentStats {
    const paths = Object.keys(document.paths || {});
    const operations: any[] = [];
    const operationsByMethod: Record<string, number> = {};

    paths.forEach((path) => {
      const pathItem = document.paths[path];
      if (!pathItem) {
        return;
      }

      const methods = Object.keys(pathItem);
      methods.forEach((method) => {
        operations.push((pathItem as any)[method]);

        if (!operationsByMethod[method]) {
          operationsByMethod[method] = 0;
        }
        operationsByMethod[method]++;
      });
    });

    const documentSize = Buffer.from(JSON.stringify(document)).length;

    return {
      totalPaths: paths.length,
      totalOperations: operations.length,
      operationsByMethod,
      totalSchemas: 0, // TODO: 스키마 계산
      totalResponses: operations.length, // 간단히 operation 수로 계산
      totalParameters: 0, // TODO: 파라미터 계산
      totalTags: 0, // TODO: 태그 계산
      totalSecuritySchemes: 0,
      documentSize,
    };
  }

  /**
   * 파일 출력
   */
  private async writeOutput(document: OpenAPIDocument): Promise<string[]> {
    const outputPaths: string[] = [];

    // 출력 디렉토리 경로 생성
    const outputDir = path.resolve(this.options.outputDir);

    if (this.options.multiFormat) {
      // 멀티 포맷 출력
      const basePath = path.join(outputDir, this.options.filename);
      const formats: OutputFormat[] = ['json', 'yaml'];

      const paths = await this.formatter.writeMultiFormat(basePath, document, formats);

      outputPaths.push(...paths);
    } else {
      // 단일 포맷 출력
      const ext = this.options.format === 'json' ? '.json' : '.yaml';
      const filePath = path.join(outputDir, this.options.filename + ext);

      await this.formatter.writeFile(filePath, document, this.options.format, {
        overwrite: this.options.overwrite,
      });

      outputPaths.push(filePath);
    }

    return outputPaths;
  }

  /**
   * 통계 출력
   */
  private printStats(stats: DocumentStats): void {
    this.log('info', '\nDocument Statistics:');
    this.log('info', `  Total Paths: ${stats.totalPaths}`);
    this.log('info', `  Total Operations: ${stats.totalOperations}`);

    if (Object.keys(stats.operationsByMethod).length > 0) {
      this.log('info', '  Operations by Method:');
      Object.entries(stats.operationsByMethod).forEach(([method, count]) => {
        this.log('info', `    ${method.toUpperCase()}: ${count}`);
      });
    }

    this.log('info', `  Document Size: ${this.formatBytes(stats.documentSize)}`);
  }

  /**
   * 바이트 크기 포맷팅
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' B';
    }
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * 로깅
   */
  private log(level: 'error' | 'warn' | 'info' | 'debug' | 'verbose', message: string): void {
    const levels = ['silent', 'error', 'warn', 'info', 'debug', 'verbose'];
    const currentLevelIndex = levels.indexOf(this.options.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex <= currentLevelIndex) {
      const prefix = `[jest-swagger]`;
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * 수집된 메타데이터 조회 (테스트용)
   */
  public getCollectedMetadata() {
    return this.collectedMetadata;
  }

  /**
   * 문서 통계 조회 (테스트용)
   */
  public getDocumentStats(): DocumentStats | undefined {
    if (this.lastResult) {
      return this.lastResult.stats;
    }

    // 임시 문서 생성하여 통계 계산
    const document = this.buildOpenAPIDocument();
    return this.calculateStats(document);
  }

  /**
   * 마지막 결과 조회 (테스트용)
   */
  public getLastResult(): ReporterResult | undefined {
    return this.lastResult;
  }
}
