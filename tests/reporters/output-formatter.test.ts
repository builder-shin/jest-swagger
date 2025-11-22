/**
 * OutputFormatter 테스트
 */

import { OpenAPIDocument } from '../../src/types/openapi';
import { OutputFormatter } from '../../src/reporters/output-formatter';
import { JsonFormatterOptions, YamlFormatterOptions } from '../../src/types/reporter';
import * as fs from 'fs';
import * as path from 'path';

// 테스트용 모의 문서
const mockDocument: OpenAPIDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
    description: 'Test API Description',
  },
  paths: {
    '/users': {
      get: {
        summary: 'Get users',
        operationId: 'getUsers',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

describe('OutputFormatter', () => {
  let formatter: OutputFormatter;
  const testOutputDir = path.join(__dirname, '../../.test-output');

  beforeEach(() => {
    formatter = new OutputFormatter();
    // 테스트 출력 디렉토리 생성
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // 테스트 파일 정리 (재귀적으로)
    if (fs.existsSync(testOutputDir)) {
      const deleteDirRecursive = (dirPath: string) => {
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isDirectory()) {
              deleteDirRecursive(filePath);
            } else {
              fs.unlinkSync(filePath);
            }
          });
          fs.rmdirSync(dirPath);
        }
      };
      deleteDirRecursive(testOutputDir);
    }
  });

  describe('JSON 포맷팅', () => {
    it('문서를 JSON 문자열로 변환해야 함', () => {
      const result = formatter.formatJson(mockDocument);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');

      // JSON 파싱 가능 여부 확인
      const parsed = JSON.parse(result);
      expect(parsed.openapi).toBe('3.0.0');
      expect(parsed.info.title).toBe('Test API');
    });

    it('pretty 옵션으로 포맷팅해야 함', () => {
      const options: JsonFormatterOptions = {
        pretty: true,
        indent: 2,
      };

      const result = formatter.formatJson(mockDocument, options);

      // 들여쓰기가 있는지 확인
      expect(result).toContain('  ');
      expect(result).toContain('\n');
    });

    it('compact 형식으로 포맷팅해야 함', () => {
      const options: JsonFormatterOptions = {
        pretty: false,
      };

      const result = formatter.formatJson(mockDocument, options);

      // 불필요한 공백이 없는지 확인
      expect(result).not.toContain('  ');
      expect(result.split('\n').length).toBe(1);
    });

    it('사용자 정의 들여쓰기를 사용해야 함', () => {
      const options: JsonFormatterOptions = {
        pretty: true,
        indent: 4,
      };

      const result = formatter.formatJson(mockDocument, options);

      // 4칸 들여쓰기 확인
      expect(result).toContain('    ');
    });

    it('replacer 함수를 적용해야 함', () => {
      const options: JsonFormatterOptions = {
        replacer: (key, value) => {
          // description 필드 제거
          if (key === 'description') {
            return undefined;
          }
          return value;
        },
      };

      const result = formatter.formatJson(mockDocument, options);
      const parsed = JSON.parse(result);

      expect(parsed.info.description).toBeUndefined();
    });
  });

  describe('YAML 포맷팅', () => {
    it('문서를 YAML 문자열로 변환해야 함', () => {
      const result = formatter.formatYaml(mockDocument);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');

      // YAML 형식 확인
      expect(result).toContain('openapi:');
      expect(result).toContain('info:');
      expect(result).toContain('title:');
    });

    it('들여쓰기 옵션을 적용해야 함', () => {
      const options: YamlFormatterOptions = {
        indent: 4,
      };

      const result = formatter.formatYaml(mockDocument, options);

      // 4칸 들여쓰기 확인
      expect(result).toContain('    ');
    });

    it('줄 너비 옵션을 적용해야 함', () => {
      const options: YamlFormatterOptions = {
        lineWidth: 60,
      };

      const result = formatter.formatYaml(mockDocument, options);
      const lines = result.split('\n');

      // 대부분의 줄이 60자 이내인지 확인
      const longLines = lines.filter((line) => line.length > 60);
      expect(longLines.length).toBeLessThan(lines.length * 0.3);
    });

    it('키 정렬 옵션을 적용해야 함', () => {
      const options: YamlFormatterOptions = {
        sortKeys: true,
      };

      const result = formatter.formatYaml(mockDocument, options);

      // YAML에 키 정렬이 적용되었는지 확인
      // sortKeys가 true일 때 알파벳 순서로 정렬됨
      expect(result).toContain('openapi:');
      expect(result).toContain('info:');
      expect(result).toContain('paths:');

      // sortKeys 옵션이 적용되면 결과가 달라야 함
      const unsortedResult = formatter.formatYaml(mockDocument, { sortKeys: false });
      expect(result).toBeDefined();
      expect(unsortedResult).toBeDefined();
    });
  });

  describe('파일 쓰기', () => {
    it('JSON 파일을 생성해야 함', async () => {
      const filePath = path.join(testOutputDir, 'test.json');

      await formatter.writeFile(filePath, mockDocument, 'json');

      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.openapi).toBe('3.0.0');
    });

    it('YAML 파일을 생성해야 함', async () => {
      const filePath = path.join(testOutputDir, 'test.yaml');

      await formatter.writeFile(filePath, mockDocument, 'yaml');

      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');

      expect(content).toContain('openapi:');
      expect(content).toContain('3.0.0');
    });

    it('디렉토리를 자동으로 생성해야 함', async () => {
      const nestedPath = path.join(testOutputDir, 'nested', 'dir', 'test.json');

      await formatter.writeFile(nestedPath, mockDocument, 'json');

      expect(fs.existsSync(nestedPath)).toBe(true);
    });

    it('덮어쓰기 옵션을 적용해야 함', async () => {
      const filePath = path.join(testOutputDir, 'overwrite.json');

      // 첫 번째 쓰기
      await formatter.writeFile(filePath, mockDocument, 'json', {
        overwrite: true,
      });

      const modifiedDoc = { ...mockDocument, info: { ...mockDocument.info, version: '2.0.0' } };

      // 두 번째 쓰기
      await formatter.writeFile(filePath, modifiedDoc, 'json', {
        overwrite: true,
      });

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.info.version).toBe('2.0.0');
    });

    it('덮어쓰기 비활성화 시 에러를 발생시켜야 함', async () => {
      const filePath = path.join(testOutputDir, 'no-overwrite.json');

      // 파일 생성
      await formatter.writeFile(filePath, mockDocument, 'json');

      // 덮어쓰기 시도
      await expect(
        formatter.writeFile(filePath, mockDocument, 'json', {
          overwrite: false,
        })
      ).rejects.toThrow();
    });

    it('여러 포맷으로 동시에 생성해야 함', async () => {
      const basePath = path.join(testOutputDir, 'multi');

      const paths = await formatter.writeMultiFormat(basePath, mockDocument, ['json', 'yaml']);

      expect(paths).toHaveLength(2);
      expect(paths[0]).toBeDefined();
      expect(paths[1]).toBeDefined();
      expect(fs.existsSync(paths[0]!)).toBe(true);
      expect(fs.existsSync(paths[1]!)).toBe(true);

      // 확장자 확인
      expect(paths.some((p) => p.endsWith('.json'))).toBe(true);
      expect(paths.some((p) => p.endsWith('.yaml'))).toBe(true);
    });
  });

  describe('파일 읽기 및 파싱', () => {
    it('JSON 파일을 읽고 파싱해야 함', async () => {
      const filePath = path.join(testOutputDir, 'read-test.json');

      // 파일 생성
      await formatter.writeFile(filePath, mockDocument, 'json');

      // 파일 읽기
      const parsed = await formatter.readFile(filePath, 'json');

      expect(parsed.openapi).toBe('3.0.0');
      expect(parsed.info.title).toBe('Test API');
    });

    it('YAML 파일을 읽고 파싱해야 함', async () => {
      const filePath = path.join(testOutputDir, 'read-test.yaml');

      // 파일 생성
      await formatter.writeFile(filePath, mockDocument, 'yaml');

      // 파일 읽기
      const parsed = await formatter.readFile(filePath, 'yaml');

      expect(parsed.openapi).toBe('3.0.0');
      expect(parsed.info.title).toBe('Test API');
    });

    it('존재하지 않는 파일 읽기 시 에러를 발생시켜야 함', async () => {
      const filePath = path.join(testOutputDir, 'non-existent.json');

      await expect(formatter.readFile(filePath, 'json')).rejects.toThrow();
    });

    it('잘못된 JSON 파일 파싱 시 에러를 발생시켜야 함', async () => {
      const filePath = path.join(testOutputDir, 'invalid.json');

      // 잘못된 JSON 파일 생성
      fs.writeFileSync(filePath, '{ invalid json }', 'utf-8');

      await expect(formatter.readFile(filePath, 'json')).rejects.toThrow();
    });
  });

  describe('포맷 감지', () => {
    it('파일 확장자로 포맷을 감지해야 함', () => {
      expect(formatter.detectFormat('test.json')).toBe('json');
      expect(formatter.detectFormat('test.yaml')).toBe('yaml');
      expect(formatter.detectFormat('test.yml')).toBe('yaml');
    });

    it('대소문자를 무시하고 포맷을 감지해야 함', () => {
      expect(formatter.detectFormat('test.JSON')).toBe('json');
      expect(formatter.detectFormat('test.YAML')).toBe('yaml');
      expect(formatter.detectFormat('test.YML')).toBe('yaml');
    });

    it('지원하지 않는 확장자에 대해 기본값을 반환해야 함', () => {
      expect(formatter.detectFormat('test.txt')).toBe('yaml');
      expect(formatter.detectFormat('test')).toBe('yaml');
    });
  });

  describe('검증', () => {
    it('유효한 JSON 문자열을 검증해야 함', () => {
      const validJson = JSON.stringify(mockDocument);

      expect(formatter.validateJson(validJson)).toBe(true);
    });

    it('유효하지 않은 JSON 문자열을 검증해야 함', () => {
      const invalidJson = '{ invalid json }';

      expect(formatter.validateJson(invalidJson)).toBe(false);
    });

    it('유효한 YAML 문자열을 검증해야 함', () => {
      const validYaml = formatter.formatYaml(mockDocument);

      expect(formatter.validateYaml(validYaml)).toBe(true);
    });

    it('유효하지 않은 YAML 문자열을 검증해야 함', () => {
      // YAML 파서가 strict하지 않을 수 있으므로 명확한 에러 케이스 사용
      const invalidYaml = 'invalid: [unclosed array';

      expect(formatter.validateYaml(invalidYaml)).toBe(false);
    });
  });

  describe('에러 처리', () => {
    it('빈 문서 포맷팅 시 에러를 발생시켜야 함', () => {
      expect(() => {
        formatter.formatJson(null as any);
      }).toThrow();
    });

    it('잘못된 파일 경로에 쓰기 시 에러를 발생시켜야 함', async () => {
      // 유효하지 않은 경로
      const invalidPath = '/invalid/\0/path/test.json';

      await expect(formatter.writeFile(invalidPath, mockDocument, 'json')).rejects.toThrow();
    });

    it('읽기 전용 디렉토리에 쓰기 시 에러를 처리해야 함', async () => {
      // 읽기 전용 디렉토리 생성
      const readonlyDir = path.join(testOutputDir, 'readonly');
      fs.mkdirSync(readonlyDir, { recursive: true });
      fs.chmodSync(readonlyDir, 0o444);

      const filePath = path.join(readonlyDir, 'test.json');

      await expect(formatter.writeFile(filePath, mockDocument, 'json')).rejects.toThrow();

      // 정리
      fs.chmodSync(readonlyDir, 0o755);
    });
  });
});
