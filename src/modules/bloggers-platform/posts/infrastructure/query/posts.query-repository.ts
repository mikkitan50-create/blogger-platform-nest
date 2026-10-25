import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, isValidObjectId } from 'mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/posts.view-dto';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { LikesQueryRepository } from '../../../likes/infrastructure/query/likes.query-repository';
import { LikeStatus } from '../../../likes/like-status';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private likesQueryRepository: LikesQueryRepository,
  ) {}

  //userId нужен для myStatus (null - анонимный запрос)
  async getByIdOrNotFoundFail(
    id: string,
    userId: string | null,
  ): Promise<PostViewDto> {
    //id не в формате ObjectId -> сразу 404 (иначе mongoose кинет CastError -> 500)
    const post = isValidObjectId(id)
      ? await this.PostModel.findOne({ _id: id, deletedAt: null })
      : null;

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'post not found',
      });
    }

    const [items] = await this.mapToViewWithLikes([post], userId);

    return items;
  }

  //blogId передаём, когда нужны посты конкретного блога (GET /blogs/{blogId}/posts)
  async getAll(
    query: GetPostsQueryParams,
    userId: string | null,
    blogId?: string,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    if (blogId) {
      filter.blogId = blogId;
    }

    const posts = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = await this.mapToViewWithLikes(posts, userId);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  //лайки для всей страницы постов достаем двумя запросами, а не отдельно для каждого поста
  private async mapToViewWithLikes(
    posts: PostDocument[],
    userId: string | null,
  ): Promise<PostViewDto[]> {
    const postIds = posts.map((post) => post._id.toString());

    const myStatuses = await this.likesQueryRepository.getMyStatuses(
      postIds,
      userId,
    );
    const newestLikes = await this.likesQueryRepository.getNewestLikes(postIds);

    return posts.map((post) => {
      const postId = post._id.toString();

      return PostViewDto.mapToView(
        post,
        myStatuses.get(postId) ?? LikeStatus.None,
        newestLikes.get(postId) ?? [],
      );
    });
  }
}
