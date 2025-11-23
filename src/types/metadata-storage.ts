/**
 * 메타데이터 저장소
 */

import {
  ApiMetadata,
  CaptureMetadata,
  MetadataStorage,
  ParameterMetadata,
  PathMetadata,
  RequestBodyMetadata,
  ResponseMetadata,
  TestMetadata,
} from './decorator.types';
import { CapturedResponse } from '../capture/response-interceptor';
import { inferSchema } from '../builders/schema-inference';

/**
 * 글로벌 메타데이터 저장소 클래스
 */
class GlobalMetadataStorage implements MetadataStorage {
  public paths = new Map<object, PathMetadata>();
  public apis = new Map<object, Map<string | symbol, ApiMetadata>>();
  public responses = new Map<object, Map<string | symbol, ResponseMetadata[]>>();
  public parameters = new Map<object, Map<string | symbol, ParameterMetadata[]>>();
  public requestBodies = new Map<object, Map<string | symbol, RequestBodyMetadata>>();

  /**
   * 캡처된 응답 저장소
   * Map<target, Map<propertyKey, Map<statusCode, CapturedResponse[]>>>
   */
  public capturedResponses = new Map<
    object,
    Map<string | symbol, Map<number, CapturedResponse[]>>
  >();

  /**
   * 캡처 메타데이터 저장소
   * Map<target, Map<propertyKey, CaptureMetadata>>
   */
  public captureMetadata = new Map<object, Map<string | symbol, CaptureMetadata>>();

  /**
   * 현재 실행 중인 테스트 메타데이터
   */
  private currentTest?: TestMetadata;

  /**
   * 경로 메타데이터 저장
   */
  setPathMetadata(target: object, metadata: PathMetadata): void {
    this.paths.set(target, metadata);
  }

  /**
   * 경로 메타데이터 조회
   */
  getPathMetadata(target: object): PathMetadata | undefined {
    return this.paths.get(target);
  }

  /**
   * API 메타데이터 저장
   */
  setApiMetadata(target: object, propertyKey: string | symbol, metadata: ApiMetadata): void {
    if (!this.apis.has(target)) {
      this.apis.set(target, new Map());
    }
    this.apis.get(target)!.set(propertyKey, metadata);
  }

  /**
   * API 메타데이터 조회
   */
  getApiMetadata(target: object, propertyKey: string | symbol): ApiMetadata | undefined {
    return this.apis.get(target)?.get(propertyKey);
  }

  /**
   * 응답 메타데이터 추가
   */
  addResponseMetadata(
    target: object,
    propertyKey: string | symbol,
    metadata: ResponseMetadata
  ): void {
    if (!this.responses.has(target)) {
      this.responses.set(target, new Map());
    }
    const methodResponses = this.responses.get(target)!;
    if (!methodResponses.has(propertyKey)) {
      methodResponses.set(propertyKey, []);
    }
    methodResponses.get(propertyKey)!.push(metadata);
  }

  /**
   * 응답 메타데이터 조회
   */
  getResponseMetadata(target: object, propertyKey: string | symbol): ResponseMetadata[] {
    return this.responses.get(target)?.get(propertyKey) || [];
  }

  /**
   * 파라미터 메타데이터 추가
   */
  addParameterMetadata(
    target: object,
    propertyKey: string | symbol,
    metadata: ParameterMetadata
  ): void {
    if (!this.parameters.has(target)) {
      this.parameters.set(target, new Map());
    }
    const methodParameters = this.parameters.get(target)!;
    if (!methodParameters.has(propertyKey)) {
      methodParameters.set(propertyKey, []);
    }
    methodParameters.get(propertyKey)!.push(metadata);
  }

  /**
   * 파라미터 메타데이터 조회
   */
  getParameterMetadata(target: object, propertyKey: string | symbol): ParameterMetadata[] {
    const params = this.parameters.get(target)?.get(propertyKey) || [];
    // 파라미터 인덱스로 정렬
    return params.sort((a, b) => a.parameterIndex - b.parameterIndex);
  }

  /**
   * 요청 본문 메타데이터 저장
   */
  setRequestBodyMetadata(
    target: object,
    propertyKey: string | symbol,
    metadata: RequestBodyMetadata
  ): void {
    if (!this.requestBodies.has(target)) {
      this.requestBodies.set(target, new Map());
    }
    this.requestBodies.get(target)!.set(propertyKey, metadata);
  }

  /**
   * 요청 본문 메타데이터 조회
   */
  getRequestBodyMetadata(
    target: object,
    propertyKey: string | symbol
  ): RequestBodyMetadata | undefined {
    return this.requestBodies.get(target)?.get(propertyKey);
  }

  /**
   * 모든 API 메타데이터 조회
   */
  getAll(): ApiMetadata[] {
    const allMetadata: ApiMetadata[] = [];

    this.apis.forEach((methodMap) => {
      methodMap.forEach((metadata) => {
        allMetadata.push(metadata);
      });
    });

    return allMetadata;
  }

  /**
   * 캡처된 응답 저장
   *
   * @param target - 대상 클래스
   * @param propertyKey - 메서드 이름
   * @param statusCode - HTTP 상태 코드
   * @param response - 캡처된 응답
   */
  setCapturedResponse(
    target: object,
    propertyKey: string | symbol,
    statusCode: number,
    response: CapturedResponse
  ): void {
    if (!this.capturedResponses.has(target)) {
      this.capturedResponses.set(target, new Map());
    }

    const methodResponses = this.capturedResponses.get(target)!;
    if (!methodResponses.has(propertyKey)) {
      methodResponses.set(propertyKey, new Map());
    }

    const statusCodeResponses = methodResponses.get(propertyKey)!;
    if (!statusCodeResponses.has(statusCode)) {
      statusCodeResponses.set(statusCode, []);
    }

    statusCodeResponses.get(statusCode)!.push(response);
  }

  /**
   * 캡처된 응답 조회 (첫 번째)
   *
   * @param target - 대상 클래스
   * @param propertyKey - 메서드 이름
   * @param statusCode - HTTP 상태 코드
   * @returns 첫 번째 캡처된 응답 또는 undefined
   */
  getCapturedResponse(
    target: object,
    propertyKey: string | symbol,
    statusCode: number
  ): CapturedResponse | undefined {
    const responses = this.getAllCapturedResponses(target, propertyKey, statusCode);
    return responses[0];
  }

  /**
   * 모든 캡처된 응답 조회
   *
   * @param target - 대상 클래스
   * @param propertyKey - 메서드 이름
   * @param statusCode - HTTP 상태 코드
   * @returns 캡처된 응답 배열
   */
  getAllCapturedResponses(
    target: object,
    propertyKey: string | symbol,
    statusCode: number
  ): CapturedResponse[] {
    return (
      this.capturedResponses
        .get(target)
        ?.get(propertyKey)
        ?.get(statusCode) || []
    );
  }

  /**
   * 데코레이터 메타데이터와 캡처된 응답을 병합
   *
   * @param decoratorMetadata - 데코레이터 메타데이터
   * @param capturedResponse - 캡처된 응답
   * @returns 병합된 응답 메타데이터
   */
  mergeResponseMetadata(
    decoratorMetadata: ResponseMetadata,
    capturedResponse: CapturedResponse
  ): ResponseMetadata {
    const merged: ResponseMetadata = {
      ...decoratorMetadata,
    };

    // 캡처된 응답에서 스키마를 자동 추론 (기존 스키마가 없는 경우에만)
    if (!merged.schema && capturedResponse.body !== null) {
      try {
        merged.schema = inferSchema(capturedResponse.body);
      } catch (error) {
        // 스키마 추론 실패시 무시
      }
    }

    // mediaType이 없으면 capturedResponse의 contentType 사용
    if (!merged.mediaType) {
      merged.mediaType = capturedResponse.contentType;
    }

    return merged;
  }

  /**
   * 캡처 메타데이터 저장
   *
   * @param target - 대상 클래스
   * @param propertyKey - 메서드 이름
   * @param metadata - 캡처 메타데이터
   */
  setCaptureMetadata(
    target: object,
    propertyKey: string | symbol,
    metadata: CaptureMetadata
  ): void {
    if (!this.captureMetadata.has(target)) {
      this.captureMetadata.set(target, new Map());
    }
    this.captureMetadata.get(target)!.set(propertyKey, metadata);
  }

  /**
   * 캡처 메타데이터 조회
   *
   * @param target - 대상 클래스
   * @param propertyKey - 메서드 이름
   * @returns 캡처 메타데이터 또는 undefined
   */
  getCaptureMetadata(
    target: object,
    propertyKey: string | symbol
  ): CaptureMetadata | undefined {
    return this.captureMetadata.get(target)?.get(propertyKey);
  }

  /**
   * 현재 테스트 설정
   *
   * @param target - 대상 클래스
   * @param propertyKey - 메서드 이름
   */
  setCurrentTest(target: object, propertyKey: string | symbol): void {
    this.currentTest = {
      target,
      propertyKey,
    };
  }

  /**
   * 현재 테스트 조회
   *
   * @returns 현재 테스트 메타데이터 또는 undefined
   */
  getCurrentTest(): TestMetadata | undefined {
    return this.currentTest;
  }

  /**
   * 현재 테스트 초기화
   */
  clearCurrentTest(): void {
    this.currentTest = undefined;
  }

  /**
   * 모든 메타데이터 초기화 (테스트용)
   */
  clear(): void {
    this.paths.clear();
    this.apis.clear();
    this.responses.clear();
    this.parameters.clear();
    this.requestBodies.clear();
    this.capturedResponses.clear();
    this.captureMetadata.clear();
    this.currentTest = undefined;
  }
}

/**
 * 글로벌 메타데이터 저장소 싱글톤 인스턴스
 */
export const metadataStorage = new GlobalMetadataStorage();
