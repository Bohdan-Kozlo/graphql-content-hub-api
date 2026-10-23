import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CommentService } from './comment.service';
import { CommentModel } from './dto/comment.model';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentArgs } from './dto/update-comment.args';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { CurrentUser } from '../../common/decorators/currentUser.decorator';
import { ContentIdArgs, IdArgs } from '../../common/dto/graphql-args';

@Resolver(() => CommentModel)
export class CommentResolver {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(AccessGuard)
  @Mutation(() => CommentModel)
  async createComment(@Args('data') data: CreateCommentInput, @CurrentUser('id') userId: string) {
    return this.commentService.create(data, userId);
  }

  @Query(() => [CommentModel])
  async commentsByContent(@Args() args: ContentIdArgs) {
    return this.commentService.findByContentId(args.contentId);
  }

  @Query(() => CommentModel)
  async comment(@Args() args: IdArgs) {
    return this.commentService.findOne(args.id);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => CommentModel)
  async updateComment(@Args() args: UpdateCommentArgs, @CurrentUser('id') userId: string) {
    return this.commentService.update(args.id, args.data, userId);
  }

  @UseGuards(AccessGuard)
  @Mutation(() => Boolean)
  async deleteComment(@Args() args: IdArgs, @CurrentUser('id') userId: string) {
    return this.commentService.remove(args.id, userId);
  }
}
