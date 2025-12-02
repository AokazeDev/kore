import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  emailVerified!: boolean;

  @Field({ nullable: true })
  image?: string | null;

  @Field({ nullable: true })
  username?: string | null;

  @Field({ nullable: true })
  bio?: string | null;

  @Field({ nullable: true })
  website?: string | null;

  @Field({ nullable: true })
  location?: string | null;

  @Field()
  role!: string;

  @Field(() => Int)
  followersCount!: number;

  @Field(() => Int)
  followingCount!: number;

  @Field(() => Int)
  postsCount!: number;

  @Field()
  isPrivate!: boolean;

  @Field()
  isVerified!: boolean;

  @Field({ nullable: true })
  verificationType?: string | null;

  @Field()
  isBanned!: boolean;

  @Field({ nullable: true })
  bannedAt?: Date | null;

  @Field({ nullable: true })
  bannedReason?: string | null;

  @Field({ nullable: true })
  lastActiveAt?: Date | null;

  @Field({ nullable: true })
  countryCode?: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
