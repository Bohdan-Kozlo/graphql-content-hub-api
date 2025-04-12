import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { ContentModule } from '../content/content.module';

@Module({
  providers: [CommentResolver, CommentService],
  imports: [ContentModule],
})
export class CommentModule {}
