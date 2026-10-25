import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { CreateCommentDto } from '../../dto/create-comment.dto';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';
import { UsersExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/users.external-query-repository';

export class CreateCommentCommand {
  constructor(public dto: CreateCommentDto) {}
}

/**
 * Создание комментария к посту: POST /posts/{postId}/comments
 */
@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase implements ICommandHandler<
  CreateCommentCommand,
  string
> {
  constructor(
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    private commentsRepository: CommentsRepository,
    private postsRepository: PostsRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}

  async execute({ dto }: CreateCommentCommand): Promise<string> {
    //если поста нет -> 404
    const post = await this.postsRepository.findOrNotFoundFail(dto.postId);

    //логин автора храним в комментарии (commentatorInfo)
    const user = await this.usersExternalQueryRepository.getByIdOrNotFoundFail(
      dto.userId,
    );

    const comment = this.CommentModel.createInstance({
      content: dto.content,
      postId: post._id.toString(),
      userId: user.id,
      userLogin: user.login,
    });

    await this.commentsRepository.save(comment);

    return comment._id.toString();
  }
}
