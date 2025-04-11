import { Module } from '@nestjs/common';
import { ViewService } from './view.service';
import { ViewResolver } from './view.resolver';

@Module({
  providers: [ViewResolver, ViewService],
})
export class ViewModule {}
