/**
 * 메타데이터 저장소
 */

import {
  ApiMetadata,
  MetadataStorage,
  ParameterMetadata,
  PathMetadata,
  RequestBodyMetadata,
  ResponseMetadata,
} from './decorator.types';

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
   * 모든 메타데이터 초기화 (테스트용)
   */
  clear(): void {
    this.paths.clear();
    this.apis.clear();
    this.responses.clear();
    this.parameters.clear();
    this.requestBodies.clear();
  }
}

/**
 * 글로벌 메타데이터 저장소 싱글톤 인스턴스
 */
export const metadataStorage = new GlobalMetadataStorage();
