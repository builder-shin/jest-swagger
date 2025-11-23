/**
 * Jest 자동 셋업
 *
 * Jest 환경에서 자동으로 응답 캡처 기능을 활성화합니다.
 *
 * 사용 방법:
 * jest.config.js 파일에서 setupFilesAfterEnv에 이 파일을 추가하세요:
 *
 * @example
 * ```javascript
 * module.exports = {
 *   setupFilesAfterEnv: ['jest-swagger/dist/setup/jest-setup.js'],
 *   // 또는 TypeScript 프로젝트의 경우:
 *   // setupFilesAfterEnv: ['jest-swagger/src/setup/jest-setup.ts'],
 * };
 * ```
 */

import { setupResponseCapture } from '../hooks/response-capture-hook';

// Jest 환경에서 자동으로 응답 캡처 활성화
setupResponseCapture();
