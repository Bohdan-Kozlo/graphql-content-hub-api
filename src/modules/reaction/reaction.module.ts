import { Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { ReactionResolver } from './reaction.resolver';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [PrismaModule, ContentModule],
  providers: [ReactionResolver, ReactionService],
  exports: [ReactionService],
})
export class ReactionModule {}
