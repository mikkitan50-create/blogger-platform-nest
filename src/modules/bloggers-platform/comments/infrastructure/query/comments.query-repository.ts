import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, isValidObjectId } from 'mongoose';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../../domain/comment.entity';
import { CommentViewDto } from '../../api/view-dto/comments.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { LikesQueryRepository } from '../../../likes/infrastructure/query/likes.query-repository';
import { LikeStatus } from '../../../likes/like-status';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private likesQueryRepository: LikesQueryRepository,
  ) {}

  //userId нужен для myStatus (null - анонимный запрос)
  async getByIdOrNotFoundFail(
    id: string,
    userId: string | null,
  ): Promise<CommentViewDto> {
    //id не в формате ObjectId -> сразу 404 (иначе mongoose кинет CastError -> 500)
    const comment = isValidObjectId(id)
      ? await this.CommentModel.findOne({ _id: id, deletedAt: null })
      : null;

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'comment not found',
      });
    }

    const [item] = await this.mapToViewWithMyStatus([comment], userId);

    return item;
  }

  //комментарии конкретного поста (GET /posts/{postId}/comments)
  async getAllForPost(
    query: GetCommentsQueryParams,
    postId: string,
    userId: string | null,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const filter: FilterQuery<Comment> = {
      postId: postId,
      deletedAt: null,
    };

    const comments = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = await this.mapToViewWithMyStatus(comments, userId);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  private async mapToViewWithMyStatus(
    comments: CommentDocument[],
    userId: string | null,
  ): Promise<CommentViewDto[]> {
    const commentIds = comments.map((comment) => comment._id.toString());

    const myStatuses = await this.likesQueryRepository.getMyStatuses(
      commentIds,
      userId,
    );

    return comments.map((comment) =>
      CommentViewDto.mapToView(
        comment,
        myStatuses.get(comment._id.toString()) ?? LikeStatus.None,
      ),
    );
  }
}
