import { Resolver } from '@nestjs/graphql';
import { ReactionService } from './reaction.service';

@Resolver()
export class ReactionResolver {
  constructor(private readonly reactionService: ReactionService) {}
}
