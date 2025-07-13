import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CommentService } from './comment.service';
import { CommentModel } from './dto/comment.model';
import { CreateCommentInput, UpdateCommentInput } from './dto/create-comment.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guards/access.guard';
import { CurrentUser } from 'src/common/decorators/currentUser.decorator';

@Resolver(() => CommentModel)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(AccessGuard)
  @Mutation(() => CommentModel)
  async createComment(
    @Args('data') data: CreateCommentInput,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentService.create(data, userId);
  }

  @Query(() => [CommentModel])
  async commentsByContent(@Args('contentId') contentId: string) {
    return this.commentService.findByContentId(contentId);
  }

  @Query(() => CommentModel)
  async comment(@Args('id') id: string) {
    return this.commentService.findOne(id);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => CommentModel)
  async updateComment(
    @Args('id') id: string,
    @Args('data') data: UpdateCommentInput,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentService.update(id, data, userId);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => Boolean)
  async deleteComment(
    @Args('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentService.remove(id, userId);
  }
}
