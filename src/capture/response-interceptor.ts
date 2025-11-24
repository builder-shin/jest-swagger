/**
 * HTTP 응답 캡처를 위한 인터셉터
 */

/**
 * 캡처된 HTTP 응답 인터페이스
 */
export interface CapturedResponse {
  /** HTTP 상태 코드 */
  statusCode: number;
  /** 응답 본문 (JSON, 문자열, 바이너리 등) */
  body: unknown;
  /** Content-Type 헤더 값 */
  contentType: string;
  /** HTTP 헤더 객체 */
  headers: Record<string, string>;
  /** 캡처 시점의 타임스탬프 (밀리초) */
  timestamp: number;
}

/**
 * HTTP 응답을 캡처하고 관리하는 클래스
 */
export class ResponseInterceptor {
  /**
   * 대기 중인 캡처된 응답들
   */
  private static pendingCaptures: CapturedResponse[] = [];

  /**
   * HTTP 응답을 캡처한다
   *
   * @param response - 캡처할 HTTP 응답 객체
   * @returns 캡처된 응답 객체
   */
  static capture(response: unknown): CapturedResponse {
    // undefined 또는 null인 경우 기본 응답 객체로 변환
    let normalizedResponse: Record<string, unknown>;
    if (response === undefined || response === null) {
      normalizedResponse = {
        status: 204,
        data: response,
      };
    } else if (typeof response === 'object') {
      normalizedResponse = response as Record<string, unknown>;
    } else {
      normalizedResponse = {
        status: 200,
        data: response,
      };
    }

    // 상태 코드 추출 (status 또는 statusCode 필드 지원)
    const status = normalizedResponse['status'];
    const statusCodeField = normalizedResponse['statusCode'];
    const statusCode =
      typeof status === 'number'
        ? status
        : typeof statusCodeField === 'number'
          ? statusCodeField
          : 200;

    // 응답 본문 추출 (data 또는 body 필드 지원)
    const data = normalizedResponse['data'];
    const bodyField = normalizedResponse['body'];
    const body = data !== undefined ? data : bodyField !== undefined ? bodyField : null;

    // 헤더 추출
    const headersField = normalizedResponse['headers'];
    const headers: Record<string, string> =
      typeof headersField === 'object' && headersField !== null
        ? (headersField as Record<string, string>)
        : {};

    // Content-Type 추출 (헤더에서 가져오거나 기본값 사용)
    const contentType = headers['content-type'] ?? headers['Content-Type'] ?? 'application/json';

    // 캡처된 응답 객체 생성
    const captured: CapturedResponse = {
      statusCode,
      body,
      contentType,
      headers,
      timestamp: Date.now(),
    };

    // pending captures에 추가
    this.pendingCaptures.push(captured);

    return captured;
  }

  /**
   * 대기 중인 캡처된 응답 목록을 반환한다
   *
   * @returns 캡처된 응답 배열의 복사본
   */
  static getPendingCaptures(): CapturedResponse[] {
    // 원본 배열의 복사본을 반환하여 외부에서 수정할 수 없도록 함
    return [...this.pendingCaptures];
  }

  /**
   * 대기 중인 캡처된 응답을 모두 초기화한다
   */
  static clearPendingCaptures(): void {
    this.pendingCaptures = [];
  }
}
