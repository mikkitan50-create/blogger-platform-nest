import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { Like, LikeModelType } from '../../../likes/domain/like.entity';
import { LikeStatus } from '../../../likes/like-status';
import { UsersExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/users.external-query-repository';

export class UpdateCommentLikeStatusCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public likeStatus: LikeStatus,
  ) {}
}

/**
 * Like / Dislike / None (снять) для комментария: PUT /comments/{commentId}/like-status
 */
@CommandHandler(UpdateCommentLikeStatusCommand)
export class UpdateCommentLikeStatusUseCase implements ICommandHandler<
  UpdateCommentLikeStatusCommand,
  void
> {
  constructor(
    @InjectModel(Like.name)
    private LikeModel: LikeModelType,
    private commentsRepository: CommentsRepository,
    private likesRepository: LikesRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}

  async execute({
    commentId,
    userId,
    likeStatus,
  }: UpdateCommentLikeStatusCommand): Promise<void> {
    const comment = await this.commentsRepository.findOrNotFoundFail(commentId);

    let like = await this.likesRepository.findByParentAndUser(
      commentId,
      userId,
    );
    const oldStatus = like ? like.status : LikeStatus.None;

    //повторный такой же статус ничего не меняет
    if (oldStatus === likeStatus) {
      return;
    }

    if (like) {
      like.updateStatus(likeStatus);
    } else {
      const user =
        await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);

      like = this.LikeModel.createInstance({
        parentId: commentId,
        userId: userId,
        userLogin: user.login,
        status: likeStatus,
      });
    }

    comment.updateLikesCount(oldStatus, likeStatus);

    await this.likesRepository.save(like);
    await this.commentsRepository.save(comment);
  }
}
