import { Module } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { ReactionResolver } from './reaction.resolver';

@Module({
  providers: [ReactionResolver, ReactionService],
})
export class ReactionModule {}
