import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarModule } from './far/far.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get('DATABASE_HOST', 'localhost');
        const isCloudSql = dbHost.startsWith('/cloudsql/');

        return {
          type: 'postgres',
          // Cloud SQL uses Unix socket, local uses TCP
          ...(isCloudSql
            ? { host: dbHost }
            : {
                host: dbHost,
                port: configService.get('DATABASE_PORT', 5432),
              }),
          username: configService.get('DATABASE_USER', 'postgres'),
          password: configService.get('DATABASE_PASSWORD', 'postgres'),
          database: configService.get('DATABASE_NAME', 'zuildup_far'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') !== 'production',
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),

    // Feature modules
    FarModule,
  ],
})
export class AppModule {}
