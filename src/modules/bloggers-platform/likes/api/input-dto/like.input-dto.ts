import { IsEnum } from 'class-validator';
import { LikeStatus } from '../../like-status';

//dto для боди PUT /posts/{postId}/like-status и PUT /comments/{commentId}/like-status
export class LikeInputDto {
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
