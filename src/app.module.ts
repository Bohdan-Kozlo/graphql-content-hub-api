import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './modules/user/user.module';
import { CommentModule } from './modules/comment/comment.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './common/redis/redis.module';
import { ContentModule } from './modules/content/content.module';
import { CategoryModule } from './modules/category/category.module';
import { TagModule } from './modules/tag/tag.module';
import { SourceModule } from './modules/source/source.module';
import { ReactionModule } from './modules/reaction/reaction.module';
import { ViewModule } from './modules/view/view.module';

@Module({
  imports: [
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: 'schema.gql',
      driver: ApolloDriver,
      playground: true,
      introspection: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UserModule,
    CommentModule,
    PrismaModule,
    RedisModule,
    ContentModule,
    CategoryModule,
    TagModule,
    SourceModule,
    ReactionModule,
    ViewModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
