import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeModelType } from '../../domain/like.entity';
import { LikeStatus } from '../../like-status';
import { LikeDetailsViewDto } from '../../../posts/api/view-dto/posts.view-dto';

//сколько последних лайков показываем у поста (newestLikes)
const NEWEST_LIKES_COUNT = 3;

@Injectable()
export class LikesQueryRepository {
  constructor(
    @InjectModel(Like.name)
    private LikeModel: LikeModelType,
  ) {}

  //статусы текущего юзера для списка постов/комментариев: Map<parentId, status>
  //для анонимного юзера везде None
  async getMyStatuses(
    parentIds: string[],
    userId: string | null,
  ): Promise<Map<string, LikeStatus>> {
    const statuses = new Map<string, LikeStatus>();

    if (!userId || !parentIds.length) {
      return statuses;
    }

    const likes = await this.LikeModel.find({
      parentId: { $in: parentIds },
      userId,
    });

    likes.forEach((like) => statuses.set(like.parentId, like.status));

    return statuses;
  }

  //последние 3 лайка (только статус Like) для каждого поста: Map<parentId, LikeDetailsViewDto[]>
  async getNewestLikes(
    parentIds: string[],
  ): Promise<Map<string, LikeDetailsViewDto[]>> {
    const newestLikes = new Map<string, LikeDetailsViewDto[]>();

    if (!parentIds.length) {
      return newestLikes;
    }

    const likes = await this.LikeModel.find({
      parentId: { $in: parentIds },
      status: LikeStatus.Like,
    }).sort({ updatedAt: -1 });

    for (const like of likes) {
      const likesForParent = newestLikes.get(like.parentId) ?? [];

      if (likesForParent.length < NEWEST_LIKES_COUNT) {
        likesForParent.push({
          addedAt: like.updatedAt,
          userId: like.userId,
          login: like.userLogin,
        });
        newestLikes.set(like.parentId, likesForParent);
      }
    }

    return newestLikes;
  }
}
