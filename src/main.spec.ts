import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from './main';
import { Pool } from 'pg';

// Stateful mock to simulate Postgres + RLS behavior
jest.mock('pg', () => {
  let dbData = [
    { id: 1, tenant_id: 'tenant1', data: 'tenant1_data_1' },
    { id: 2, tenant_id: 'tenant2', data: 'tenant2_data_1' },
  ];
  
  const mPool = {
    connect: jest.fn().mockResolvedValue({
      _current_tenant: null,
      query: jest.fn().mockImplementation(async function(queryStr, params) {
        if (queryStr.includes('SET LOCAL app.current_tenant_id')) {
          const match = queryStr.match(/=\s*'([^']+)'/);
          if (match) this._current_tenant = match[1];
          return { rows: [] };
        }
        
        // Simulate RLS: Filter/enforce by current tenant
        if (!this._current_tenant) {
          throw new Error('RLS Violation: No tenant context set');
        }

        if (queryStr.includes('SELECT')) {
          const rows = dbData.filter(r => r.tenant_id === this._current_tenant);
          return { rows, rowCount: rows.length };
        }
        if (queryStr.includes('INSERT')) {
          const newRow = { id: Math.random(), tenant_id: params[0], data: params[1] };
          if (newRow.tenant_id !== this._current_tenant) throw new Error('RLS Violation: Insert mismatch');
          dbData.push(newRow);
          return { rows: [newRow], rowCount: 1 };
        }
        if (queryStr.includes('DELETE')) {
          const deletedRows = dbData.filter(r => r.tenant_id === this._current_tenant);
          dbData = dbData.filter(r => r.tenant_id !== this._current_tenant);
          return { rows: deletedRows, rowCount: deletedRows.length };
        }
        return { rows: [], rowCount: 0 };
      }),
      release: jest.fn(),
    }),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // nothing to seed, mock handles it
  });

  afterAll(async () => {
    // cleanup
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/data (GET) - Unauthorized without token', () => {
    return request(app.getHttpServer())
      .get('/data')
      .expect(403);
  });

  it('/data (GET) - Authorized with valid token (Viewer) - Only sees own tenant data', async () => {
    const token = jwt.sign({ tenantId: 'tenant1', role: 'viewer' }, 'secret');
    const res = await request(app.getHttpServer())
      .get('/data')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
      
    expect(res.body.length).toBe(1);
    expect(res.body[0].data).toBe('tenant1_data_1');
    expect(res.body[0].tenant_id).toBe('tenant1');
  });

  it('/data (GET) - Another Tenant sees only their data', async () => {
    const token = jwt.sign({ tenantId: 'tenant2', role: 'viewer' }, 'secret');
    const res = await request(app.getHttpServer())
      .get('/data')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
      
    expect(res.body.length).toBe(1);
    expect(res.body[0].data).toBe('tenant2_data_1');
    expect(res.body[0].tenant_id).toBe('tenant2');
  });

  it('/data (POST) - Viewer Role forbidden', async () => {
    const token = jwt.sign({ tenantId: 'tenant1', role: 'viewer' }, 'secret');
    await request(app.getHttpServer())
      .post('/data')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: 'hacked' })
      .expect(403);
  });

  it('/data (POST) - Admin Role creates data', async () => {
    const token = jwt.sign({ tenantId: 'tenant1', role: 'admin' }, 'secret');
    const res = await request(app.getHttpServer())
      .post('/data')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: 'new_tenant1_data' })
      .expect(201);
      
    expect(res.body.data).toBe('new_tenant1_data');
    expect(res.body.tenant_id).toBe('tenant1');

    // Verify it is isolated
    const token2 = jwt.sign({ tenantId: 'tenant2', role: 'viewer' }, 'secret');
    const res2 = await request(app.getHttpServer())
      .get('/data')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);
    expect(res2.body.length).toBe(1); // Tenant 2 still only has 1 record
  });

  it('/data (DELETE) - RLS prevents deleting other tenant data', async () => {
    const token = jwt.sign({ tenantId: 'tenant1', role: 'admin' }, 'secret');
    const res = await request(app.getHttpServer())
      .delete('/data')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
      
    // Should have deleted 2 records (tenant1_data_1 and new_tenant1_data)
    expect(res.body.length).toBe(2);
    
    // Verify tenant2 data is untouched
    const token2 = jwt.sign({ tenantId: 'tenant2', role: 'viewer' }, 'secret');
    const res2 = await request(app.getHttpServer())
      .get('/data')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);
    expect(res2.body.length).toBe(1);
    expect(res2.body[0].data).toBe('tenant2_data_1');
  });
});
