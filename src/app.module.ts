import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './modules/user/user.module';
import { CommentModule } from './modules/comment/comment.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: 'schema.gql',
      driver: ApolloDriver,
      playground: true,
      introspection: true,
    }),
    UserModule,
    CommentModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
