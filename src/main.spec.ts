import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule, DataController } from './main';

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 1, data: 'tenant1_data' }] }),
      release: jest.fn(),
    }),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/data (GET) - Unauthorized without token', () => {
    return request(app.getHttpServer())
      .get('/data')
      .expect(403); // Forbidden
  });

  it('/data (GET) - Authorized with valid token', () => {
    const token = jwt.sign({ tenantId: 'tenant1', role: 'admin' }, 'secret');
    return request(app.getHttpServer())
      .get('/data')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect([{ id: 1, data: 'tenant1_data' }]);
  });
});
