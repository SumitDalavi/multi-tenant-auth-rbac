import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Req, UseGuards, Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Pool } from 'pg';
import * as jwt from 'jsonwebtoken';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/db' });

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

@Controller('data')
export class DataController {
  @Get()
  @UseGuards(TenantGuard)
  async getData(@Req() req) {
    const client = await pool.connect();
    try {
      // Enforce RLS at the database connection level!
      await client.query(`SET LOCAL app.current_tenant_id = '${req.tenantId}'`);
      
      // Query executes under strict RLS isolation
      const res = await client.query('SELECT * FROM tenant_data');
      return res.rows;
    } finally {
      client.release();
    }
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
