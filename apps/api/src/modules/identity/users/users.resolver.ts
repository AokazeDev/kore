import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'user', nullable: true })
  async findById(
    @Args('id', { type: () => ID }) id: string
  ): Promise<typeof User.prototype | undefined> {
    return this.usersService.findById(id);
  }

  @Query(() => User, { name: 'userByUsername', nullable: true })
  async findByUsername(
    @Args('username') username: string
  ): Promise<typeof User.prototype | undefined> {
    return this.usersService.findByUsername(username);
  }
}
