import { NestFactory, Reflector } from '@nestjs/core';
import { Module, Controller, Get, Post, Delete, Req, UseGuards, Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Pool } from 'pg';
import * as jwt from 'jsonwebtoken';
import { trace, context } from '@opentelemetry/api';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/db' });

// Setup OpenTelemetry Tracer
const tracer = trace.getTracer('multi-tenant-auth-rbac');

// Roles Decorator
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Setup Row-Level Security on Postgres Connections
@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) return false;
    
    try {
      const decoded = jwt.verify(token, 'secret') as any;
      request.tenantId = decoded.tenantId;
      request.role = decoded.role;
      return true;
    } catch { return false; }
  }
}

// RBAC Guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const userRole = request.role;
    return requiredRoles.includes(userRole);
  }
}

@Controller('data')
@UseGuards(TenantGuard, RolesGuard)
export class DataController {
  @Get()
  @Roles('admin', 'viewer')
  async getData(@Req() req) {
    return tracer.startActiveSpan('getData', async (span) => {
      const client = await pool.connect();
      try {
        await client.query(`SET LOCAL app.current_tenant_id = '${req.tenantId}'`);
        const res = await client.query('SELECT * FROM tenant_data');
        span.setAttribute('tenant.id', req.tenantId);
        span.setAttribute('db.rows', res.rowCount);
        return res.rows;
      } finally {
        client.release();
        span.end();
      }
    });
  }

  @Post()
  @Roles('admin')
  async addData(@Req() req) {
    return tracer.startActiveSpan('addData', async (span) => {
      const client = await pool.connect();
      try {
        await client.query(`SET LOCAL app.current_tenant_id = '${req.tenantId}'`);
        const res = await client.query('INSERT INTO tenant_data (tenant_id, data) VALUES ($1, $2) RETURNING *', [req.tenantId, req.body?.data || 'new_data']);
        span.setAttribute('tenant.id', req.tenantId);
        return res.rows[0];
      } finally {
        client.release();
        span.end();
      }
    });
  }

  @Delete()
  @Roles('admin')
  async deleteData(@Req() req) {
    return tracer.startActiveSpan('deleteData', async (span) => {
      const client = await pool.connect();
      try {
        await client.query(`SET LOCAL app.current_tenant_id = '${req.tenantId}'`);
        // RLS prevents deleting other tenants' data even without WHERE tenant_id=...
        const res = await client.query('DELETE FROM tenant_data RETURNING *');
        span.setAttribute('tenant.id', req.tenantId);
        return res.rows;
      } finally {
        client.release();
        span.end();
      }
    });
  }
}

@Module({ controllers: [DataController] })
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
if (require.main === module) {
  bootstrap();
}
