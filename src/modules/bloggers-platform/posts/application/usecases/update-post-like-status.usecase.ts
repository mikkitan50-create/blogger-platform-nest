import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { Like, LikeModelType } from '../../../likes/domain/like.entity';
import { LikeStatus } from '../../../likes/like-status';
import { UsersExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/users.external-query-repository';

export class UpdatePostLikeStatusCommand {
  constructor(
    public postId: string,
    public userId: string,
    public likeStatus: LikeStatus,
  ) {}
}

/**
 * Like / Dislike / None (снять) для поста: PUT /posts/{postId}/like-status
 */
@CommandHandler(UpdatePostLikeStatusCommand)
export class UpdatePostLikeStatusUseCase implements ICommandHandler<
  UpdatePostLikeStatusCommand,
  void
> {
  constructor(
    @InjectModel(Like.name)
    private LikeModel: LikeModelType,
    private postsRepository: PostsRepository,
    private likesRepository: LikesRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}

  async execute({
    postId,
    userId,
    likeStatus,
  }: UpdatePostLikeStatusCommand): Promise<void> {
    const post = await this.postsRepository.findOrNotFoundFail(postId);

    let like = await this.likesRepository.findByParentAndUser(postId, userId);
    const oldStatus = like ? like.status : LikeStatus.None;

    //повторный такой же статус ничего не меняет
    if (oldStatus === likeStatus) {
      return;
    }

    if (like) {
      like.updateStatus(likeStatus);
    } else {
      //логин нужен для newestLikes
      const user =
        await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);

      like = this.LikeModel.createInstance({
        parentId: postId,
        userId: userId,
        userLogin: user.login,
        status: likeStatus,
      });
    }

    post.updateLikesCount(oldStatus, likeStatus);

    await this.likesRepository.save(like);
    await this.postsRepository.save(post);
  }
}
