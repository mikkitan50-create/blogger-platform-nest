import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { CommentViewDto } from '../../api/view-dto/comments.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';

export class GetPostCommentsQuery {
  constructor(
    public postId: string,
    public queryParams: GetCommentsQueryParams,
    public userId: string | null,
  ) {}
}

@QueryHandler(GetPostCommentsQuery)
export class GetPostCommentsQueryHandler implements IQueryHandler<
  GetPostCommentsQuery,
  PaginatedViewDto<CommentViewDto[]>
> {
  constructor(
    private commentsQueryRepository: CommentsQueryRepository,
    private postsRepository: PostsRepository,
  ) {}

  async execute({
    postId,
    queryParams,
    userId,
  }: GetPostCommentsQuery): Promise<PaginatedViewDto<CommentViewDto[]>> {
    //если поста нет -> 404
    await this.postsRepository.findOrNotFoundFail(postId);

    return this.commentsQueryRepository.getAllForPost(
      queryParams,
      postId,
      userId,
    );
  }
}
