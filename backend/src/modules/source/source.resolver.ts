import { Args, Query, Resolver } from '@nestjs/graphql';
import { SourceService } from './source.service';
import { SourceModel } from './dto/source.model';
import { CreateSourceInput } from './dto/create-source.input';
import { UpdateSourceArgs } from './dto/update-source.args';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from '../../common/guards/access.guard';
import { Roles } from '../../common/decorators/reles.decorator';
import { Role } from '../../../prisma/generated/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IdArgs } from '../../common/dto/graphql-args';

@UseGuards(AccessGuard)
@Resolver()
export class SourceResolver {
  constructor(private readonly sourceService: SourceService) {}

  @Query(() => [SourceModel])
  sources() {
    return this.sourceService.findAll();
  }

  @Query(() => SourceModel)
  source(@Args() args: IdArgs) {
    return this.sourceService.findOne(args.id);
  }

  @Query(() => SourceModel)
  createSource(@Args('data') data: CreateSourceInput) {
    return this.sourceService.create(data);
  }

  @Query(() => SourceModel)
  updateSource(@Args() args: UpdateSourceArgs) {
    return this.sourceService.update(args.id, args.data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Boolean)
  deleteSource(@Args() args: IdArgs) {
    return this.sourceService.remove(args.id);
  }
}
