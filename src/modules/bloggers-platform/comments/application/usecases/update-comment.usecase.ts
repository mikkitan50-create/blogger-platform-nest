import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public content: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase implements ICommandHandler<
  UpdateCommentCommand,
  void
> {
  constructor(private commentsRepository: CommentsRepository) {}

  async execute({
    commentId,
    userId,
    content,
  }: UpdateCommentCommand): Promise<void> {
    const comment = await this.commentsRepository.findOrNotFoundFail(commentId);

    //чужой комментарий менять нельзя -> 403
    if (!comment.isOwner(userId)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'You can not edit comment that is not your own',
      });
    }

    comment.update(content);

    await this.commentsRepository.save(comment);
  }
}
