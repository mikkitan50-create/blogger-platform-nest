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

  static mapToView(comment: CommentDocument): CommentViewDto {
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
      //авторизации пока нет, поэтому статус текущего пользователя всегда None
      myStatus: LikeStatus.None,
    };

    return dto;
  }
}
