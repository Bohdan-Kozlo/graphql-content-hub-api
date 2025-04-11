import { Resolver } from '@nestjs/graphql';
import { ViewService } from './view.service';

@Resolver()
export class ViewResolver {
  constructor(private readonly viewService: ViewService) {}
}
