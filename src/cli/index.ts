#!/usr/bin/env node

/**
 * Jest-Swagger CLI 도구
 *
 * OpenAPI 문서 생성 및 검증을 위한 명령줄 인터페이스
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { stringify } from 'yaml';

const program = new Command();

program
  .name('jest-swagger')
  .description('Jest 테스트에서 OpenAPI 문서를 자동 생성하는 CLI 도구')
  .version('0.1.0');

/**
 * 문서 생성 명령
 */
program
  .command('generate')
  .description('OpenAPI 문서 생성')
  .option('-i, --input <path>', '입력 파일 경로 (JSON)', 'openapi.json')
  .option('-o, --output <path>', '출력 파일 경로', 'openapi.yaml')
  .option('-f, --format <type>', '출력 포맷 (json|yaml)', 'yaml')
  .action((options) => {
    try {
      const inputPath = resolve(process.cwd(), options.input);

      if (!existsSync(inputPath)) {
        console.error(`❌ 입력 파일을 찾을 수 없습니다: ${inputPath}`);
        process.exit(1);
      }

      // OpenAPI 문서 읽기
      const content = readFileSync(inputPath, 'utf-8');
      const document = JSON.parse(content);

      // 출력 포맷에 따라 변환
      let output: string;
      let outputPath: string;

      if (options.format === 'yaml') {
        output = stringify(document, {
          indent: 2,
          lineWidth: 100,
        });
        outputPath = options.output.endsWith('.yaml')
          ? options.output
          : options.output.replace(/\.json$/, '.yaml');
      } else {
        output = JSON.stringify(document, null, 2);
        outputPath = options.output.endsWith('.json')
          ? options.output
          : options.output.replace(/\.yaml$/, '.json');
      }

      // 파일 저장
      const fullOutputPath = resolve(process.cwd(), outputPath);
      writeFileSync(fullOutputPath, output, 'utf-8');

      console.log(`✅ OpenAPI 문서가 생성되었습니다: ${fullOutputPath}`);
      console.log(`   포맷: ${options.format.toUpperCase()}`);
      console.log(`   경로 개수: ${Object.keys(document.paths || {}).length}`);
      console.log(`   컴포넌트 개수: ${Object.keys(document.components?.schemas || {}).length}`);
    } catch (error) {
      console.error('❌ 문서 생성 중 오류 발생:', error);
      process.exit(1);
    }
  });

/**
 * 문서 검증 명령
 */
program
  .command('validate')
  .description('OpenAPI 문서 검증')
  .argument('<file>', '검증할 OpenAPI 문서 파일')
  .action((file) => {
    try {
      const filePath = resolve(process.cwd(), file);

      if (!existsSync(filePath)) {
        console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
        process.exit(1);
      }

      // 파일 읽기
      const content = readFileSync(filePath, 'utf-8');
      let document;

      if (filePath.endsWith('.json')) {
        document = JSON.parse(content);
      } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        // YAML 파싱은 yaml 라이브러리가 필요
        console.error('❌ YAML 검증은 아직 지원되지 않습니다. JSON 파일을 사용하세요.');
        process.exit(1);
      } else {
        console.error('❌ 지원하지 않는 파일 형식입니다. JSON 또는 YAML 파일을 사용하세요.');
        process.exit(1);
      }

      // 기본 검증
      const errors: string[] = [];

      if (!document.openapi) {
        errors.push('openapi 필드가 없습니다');
      } else if (!document.openapi.startsWith('3.')) {
        errors.push(`지원하지 않는 OpenAPI 버전입니다: ${document.openapi}`);
      }

      if (!document.info) {
        errors.push('info 필드가 없습니다');
      } else {
        if (!document.info.title) {
          errors.push('info.title 필드가 없습니다');
        }
        if (!document.info.version) {
          errors.push('info.version 필드가 없습니다');
        }
      }

      if (!document.paths) {
        errors.push('paths 필드가 없습니다');
      }

      if (errors.length > 0) {
        console.error('❌ OpenAPI 문서가 유효하지 않습니다:');
        errors.forEach((error) => console.error(`   - ${error}`));
        process.exit(1);
      }

      console.log('✅ OpenAPI 문서가 유효합니다');
      console.log(`   버전: ${document.openapi}`);
      console.log(`   제목: ${document.info.title}`);
      console.log(`   버전: ${document.info.version}`);
      console.log(`   경로 개수: ${Object.keys(document.paths).length}`);
    } catch (error) {
      console.error('❌ 문서 검증 중 오류 발생:', error);
      process.exit(1);
    }
  });

/**
 * 정보 출력 명령
 */
program
  .command('info')
  .description('OpenAPI 문서 정보 출력')
  .argument('<file>', 'OpenAPI 문서 파일')
  .action((file) => {
    try {
      const filePath = resolve(process.cwd(), file);

      if (!existsSync(filePath)) {
        console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
        process.exit(1);
      }

      const content = readFileSync(filePath, 'utf-8');
      const document = JSON.parse(content);

      console.log('\n📄 OpenAPI 문서 정보\n');
      console.log(`제목: ${document.info?.title || 'N/A'}`);
      console.log(`버전: ${document.info?.version || 'N/A'}`);
      console.log(`설명: ${document.info?.description || 'N/A'}`);
      console.log(`OpenAPI 버전: ${document.openapi || 'N/A'}`);

      const paths = Object.keys(document.paths || {});
      console.log(`\n📍 경로 (${paths.length}개):`);
      paths.slice(0, 10).forEach((path) => {
        const methods = Object.keys(document.paths[path] || {}).filter((m) =>
          ['get', 'post', 'put', 'delete', 'patch'].includes(m)
        );
        console.log(`   ${path} (${methods.join(', ').toUpperCase()})`);
      });
      if (paths.length > 10) {
        console.log(`   ... 그 외 ${paths.length - 10}개`);
      }

      const schemas = Object.keys(document.components?.schemas || {});
      console.log(`\n🔧 컴포넌트 스키마 (${schemas.length}개):`);
      schemas.slice(0, 10).forEach((schema) => {
        console.log(`   - ${schema}`);
      });
      if (schemas.length > 10) {
        console.log(`   ... 그 외 ${schemas.length - 10}개`);
      }

      console.log('');
    } catch (error) {
      console.error('❌ 정보 출력 중 오류 발생:', error);
      process.exit(1);
    }
  });

program.parse();
