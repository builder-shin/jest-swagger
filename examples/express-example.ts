/**
 * Express.js 통합 예제
 *
 * Express 앱에서 jest-swagger를 사용하는 방법을 보여주는 예제
 */

import express from 'express';
import { createSwaggerMiddleware, DocumentBuilder } from '../src';

const app = express();

// JSON 파싱 미들웨어
app.use(express.json());

// Swagger 문서 빌더 생성
const builder = new DocumentBuilder('Express API', '1.0.0')
  .setDescription('Express.js API 문서 예제')
  .addServer('http://localhost:3000', '로컬 개발 서버');

// Swagger 미들웨어 등록
app.use(
  createSwaggerMiddleware({
    builder,
    path: '/api-docs',
    autoCollect: true, // 자동으로 라우트 수집
    excludePaths: ['/health'], // 제외할 경로
    format: 'json', // 또는 'yaml'
  })
);

// 헬스 체크 엔드포인트 (문서에서 제외됨)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 사용자 목록 조회
app.get('/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ]);
});

// 사용자 조회
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id, name: 'John Doe', email: 'john@example.com' });
});

// 사용자 생성
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ id: 3, name, email });
});

// 사용자 수정
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  res.json({ id, name, email });
});

// 사용자 삭제
app.delete('/users/:id', (req, res) => {
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

export default app;
