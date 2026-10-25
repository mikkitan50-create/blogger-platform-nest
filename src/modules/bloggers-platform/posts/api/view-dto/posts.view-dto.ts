import { PostDocument } from '../../domain/post.entity';
import { LikeStatus } from '../../../likes/like-status';

export class LikeDetailsViewDto {
  addedAt: Date;
  userId: string;
  login: string;
}

export class ExtendedLikesInfoViewDto {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: LikeDetailsViewDto[];
}

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: ExtendedLikesInfoViewDto;

  //myStatus и newestLikes берем из коллекции likes в query репозитории
  static mapToView(
    post: PostDocument,
    myStatus: LikeStatus,
    newestLikes: LikeDetailsViewDto[],
  ): PostViewDto {
    const dto = new PostViewDto();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.createdAt = post.createdAt;
    dto.extendedLikesInfo = {
      likesCount: post.likesCount,
      dislikesCount: post.dislikesCount,
      myStatus: myStatus,
      newestLikes: newestLikes,
    };

    return dto;
  }
}
