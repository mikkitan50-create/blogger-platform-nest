import { CommentDocument } from '../../domain/comment.entity';
import { LikeStatus } from '../../../likes/like-status';

export class CommentatorInfoViewDto {
  userId: string;
  userLogin: string;
}

export class LikesInfoViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
}

export class CommentViewDto {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfoViewDto;
  createdAt: Date;
  likesInfo: LikesInfoViewDto;

  //myStatus берем из коллекции likes в query репозитории
  static mapToView(
    comment: CommentDocument,
    myStatus: LikeStatus,
  ): CommentViewDto {
    const dto = new CommentViewDto();

    dto.id = comment._id.toString();
    dto.content = comment.content;
    dto.commentatorInfo = {
      userId: comment.commentatorInfo.userId,
      userLogin: comment.commentatorInfo.userLogin,
    };
    dto.createdAt = comment.createdAt;
    dto.likesInfo = {
      likesCount: comment.likesCount,
      dislikesCount: comment.dislikesCount,
      myStatus: myStatus,
    };

    return dto;
  }
}
