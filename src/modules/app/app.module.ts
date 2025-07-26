import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'node-config-ts';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    AuthModule,
    SentryModule.forRoot(),
    TypeOrmModule.forRoot({
      type: config.database.type as
        | 'postgres'
        | 'mysql'
        | 'sqlite'
        | 'mariadb'
        | 'mssql'
        | 'oracle'
        | 'mongodb',
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.database,
      entities: [__dirname + '/../../entities/**/*.entity{.ts,.js}'],
      synchronize: config.database.synchronize,
      logging: config.database.logging,
    }),
    CacheModule.register({
      isGlobal: config.cache.global,
      store: redisStore,
      host: config.cache.host,
      port: config.cache.port,
      ttl: config.cache.ttl,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
