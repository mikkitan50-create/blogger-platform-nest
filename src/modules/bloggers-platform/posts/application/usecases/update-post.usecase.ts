import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePostDto } from '../../dto/create-post.dto';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import {
  DomainException,
  Extension,
} from '../../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdatePostCommand {
  constructor(
    public id: string,
    public dto: UpdatePostDto,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<
  UpdatePostCommand,
  void
> {
  constructor(
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute({ id, dto }: UpdatePostCommand): Promise<void> {
    const post = await this.postsRepository.findOrNotFoundFail(id);

    const blog = await this.blogsRepository.findById(dto.blogId);

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Blog not found',
        extensions: [new Extension('blog not found', 'blogId')],
      });
    }

    post.update({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blog._id.toString(),
      blogName: blog.name,
    });

    await this.postsRepository.save(post);
  }
}
