import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    //TODO: move to ConfigModule. will be in the following lessons
    MongooseModule.forRoot(
      process.env.MONGO_URL ?? 'mongodb://localhost/nest-bloggers-platform',
      { dbName: process.env.DB_NAME },
    ),
    CoreModule,
  ],
})
export class AppModule {}