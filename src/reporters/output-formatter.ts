/**
 * OutputFormatter 클래스
 * OpenAPI 문서를 다양한 포맷(JSON, YAML)으로 변환하고 파일로 저장
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { OpenAPIDocument } from '../types/openapi';
import {
  OutputFormat,
  JsonFormatterOptions,
  YamlFormatterOptions,
  FileWriterOptions,
} from '../types/reporter';

/**
 * OutputFormatter
 * 문서 포맷 변환 및 파일 I/O 담당
 */
export class OutputFormatter {
  /**
   * JSON 포맷으로 변환
   */
  public formatJson(document: OpenAPIDocument, options: JsonFormatterOptions = {}): string {
    if (!document) {
      throw new Error('Document is required');
    }

    const { pretty = true, indent = 2, replacer = null } = options;

    if (pretty) {
      return JSON.stringify(document, replacer as any, indent);
    }

    return JSON.stringify(document, replacer as any);
  }

  /**
   * YAML 포맷으로 변환
   */
  public formatYaml(document: OpenAPIDocument, options: YamlFormatterOptions = {}): string {
    if (!document) {
      throw new Error('Document is required');
    }

    const { indent = 2, lineWidth = 80, sortKeys = false, flowLevel = -1 } = options;

    return yaml.dump(document, {
      indent,
      lineWidth,
      sortKeys,
      flowLevel,
      noRefs: true,
      noCompatMode: true,
    });
  }

  /**
   * 파일로 저장
   */
  public async writeFile(
    filePath: string,
    document: OpenAPIDocument,
    format: OutputFormat,
    options: Partial<FileWriterOptions> = {}
  ): Promise<void> {
    const { overwrite = true, createDir = true, encoding = 'utf-8' } = options;

    // 파일이 이미 존재하고 덮어쓰기가 비활성화된 경우
    if (!overwrite && fs.existsSync(filePath)) {
      throw new Error(`File already exists: ${filePath}`);
    }

    // 디렉토리 생성
    if (createDir) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // 포맷에 따라 변환
    let content: string;
    if (format === 'json') {
      content = this.formatJson(document, { pretty: true, indent: 2 });
    } else {
      content = this.formatYaml(document, { indent: 2 });
    }

    // 파일 쓰기
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, content, encoding, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 여러 포맷으로 동시에 저장
   */
  public async writeMultiFormat(
    basePath: string,
    document: OpenAPIDocument,
    formats: OutputFormat[]
  ): Promise<string[]> {
    const outputPaths: string[] = [];

    for (const format of formats) {
      const ext = format === 'json' ? '.json' : '.yaml';
      const filePath = basePath + ext;

      await this.writeFile(filePath, document, format);
      outputPaths.push(filePath);
    }

    return outputPaths;
  }

  /**
   * 파일 읽기 및 파싱
   */
  public async readFile(filePath: string, format: OutputFormat): Promise<OpenAPIDocument> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          let document: OpenAPIDocument;

          if (format === 'json') {
            document = JSON.parse(data);
          } else {
            document = yaml.load(data) as OpenAPIDocument;
          }

          resolve(document);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * 파일 확장자로 포맷 감지
   */
  public detectFormat(filePath: string): OutputFormat {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.json') {
      return 'json';
    } else if (ext === '.yaml' || ext === '.yml') {
      return 'yaml';
    }

    // 기본값
    return 'yaml';
  }

  /**
   * JSON 문자열 검증
   */
  public validateJson(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * YAML 문자열 검증
   */
  public validateYaml(content: string): boolean {
    try {
      yaml.load(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * JSON 문자열 파싱
   */
  public parseJson(content: string): OpenAPIDocument {
    return JSON.parse(content);
  }

  /**
   * YAML 문자열 파싱
   */
  public parseYaml(content: string): OpenAPIDocument {
    return yaml.load(content) as OpenAPIDocument;
  }

  /**
   * 포맷에 따라 파싱
   */
  public parse(content: string, format: OutputFormat): OpenAPIDocument {
    if (format === 'json') {
      return this.parseJson(content);
    } else {
      return this.parseYaml(content);
    }
  }

  /**
   * 파일 존재 여부 확인
   */
  public exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * 파일 삭제
   */
  public async deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 디렉토리 내 파일 목록 조회
   */
  public listFiles(dir: string, pattern?: RegExp): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = fs.readdirSync(dir);

    if (pattern) {
      return files.filter((file) => pattern.test(file));
    }

    return files;
  }

  /**
   * 파일 정보 조회
   */
  public getFileInfo(filePath: string): {
    size: number;
    created: Date;
    modified: Date;
  } | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);

    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  }
}
