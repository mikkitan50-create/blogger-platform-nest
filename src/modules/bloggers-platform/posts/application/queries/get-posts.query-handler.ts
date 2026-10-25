import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { PostViewDto } from '../../api/view-dto/posts.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/query/blogs.query-repository';

export class GetPostsQuery {
  constructor(
    public queryParams: GetPostsQueryParams,
    public userId: string | null,
    //передаем, когда нужны посты конкретного блога (GET /blogs/{blogId}/posts)
    public blogId?: string,
  ) {}
}

@QueryHandler(GetPostsQuery)
export class GetPostsQueryHandler implements IQueryHandler<
  GetPostsQuery,
  PaginatedViewDto<PostViewDto[]>
> {
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute({
    queryParams,
    userId,
    blogId,
  }: GetPostsQuery): Promise<PaginatedViewDto<PostViewDto[]>> {
    //если блога нет -> 404
    if (blogId) {
      await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
    }

    return this.postsQueryRepository.getAll(queryParams, userId, blogId);
  }
}
