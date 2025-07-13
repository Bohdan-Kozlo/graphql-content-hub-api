import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { ContentModule } from '../content/content.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [ContentModule, PrismaModule],
  providers: [CommentResolver, CommentService],
  exports: [CommentService],
})
export class CommentModule {}
