import { Args, Query, Resolver } from '@nestjs/graphql';
import { SourceService } from './source.service';
import { SourceModel } from './dto/source.model';
import { CreateSourceInput, UpdateSourceInput } from './dto/create-source.input';
import { UseGuards } from '@nestjs/common';
import { AccessGuard } from 'src/common/guards/access.guard';
import { Roles } from 'src/common/decorators/reles.decorator';
import { Role } from 'prisma/generated';
import { RolesGuard } from 'src/common/guards/roles.guard';

@UseGuards(AccessGuard)
@Resolver()
export class SourceResolver {
  constructor(private readonly sourceService: SourceService) {}

  @Query(() => [SourceModel])
  sources() {
    return this.sourceService.findAll();
  }

  @Query(() => SourceModel)
  source(@Args('id') id: string) {
    return this.sourceService.findOne(id);
  }

  @Query(() => SourceModel)
  createSource(@Args('data') data: CreateSourceInput) {
    return this.sourceService.create(data);
  }

  @Query(() => SourceModel)
  updateSource(@Args('id') id: string, @Args('data') data: UpdateSourceInput) {
    return this.sourceService.update(id, data);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Boolean)
  deleteSource(@Args('id') id: string) {
    return this.sourceService.remove(id);
  }
}
