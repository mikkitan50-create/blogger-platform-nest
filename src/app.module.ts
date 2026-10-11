import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from './core/core.module';
import { TestingModule } from './modules/testing/testing.module';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';

@Module({
  imports: [
    //TODO: move to ConfigModule. will be in the following lessons
    MongooseModule.forRoot(
      process.env.MONGO_URL ?? 'mongodb://localhost/nest-bloggers-platform',
      { dbName: process.env.DB_NAME },
    ),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule, //все модули должны быть заимпортированы в корневой модуль, либо напрямую, либо по цепочке (через другие модули)
    CoreModule,
  ],
})
export class AppModule {}
