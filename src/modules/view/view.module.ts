import { Module } from '@nestjs/common';
import { ViewService } from './view.service';
import { ViewResolver } from './view.resolver';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [PrismaModule, ContentModule],
  providers: [ViewResolver, ViewService],
  exports: [ViewService],
})
export class ViewModule {}
