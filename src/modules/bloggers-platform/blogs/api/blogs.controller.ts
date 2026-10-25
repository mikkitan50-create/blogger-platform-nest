import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBasicAuth, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BlogViewDto } from './view-dto/blogs.view-dto';
import { CreateBlogInputDto } from './input-dto/blogs.input-dto';
import { UpdateBlogInputDto } from './input-dto/update-blog.input-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
import { GetBlogsQuery } from '../application/queries/get-blogs.query-handler';
import { GetBlogByIdQuery } from '../application/queries/get-blog-by-id.query-handler';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostForBlogInputDto } from '../../posts/api/input-dto/posts.input-dto';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecase';
import { GetPostsQuery } from '../../posts/application/queries/get-posts.query-handler';
import { GetPostByIdQuery } from '../../posts/application/queries/get-post-by-id.query-handler';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { JwtOptionalAuthGuard } from '../../../user-accounts/guards/bearer/jwt-optional-auth.guard';
import { ExtractUserIfExistsFromRequest } from '../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator';
import { UserContextDto } from '../../../user-accounts/guards/dto/user-context.dto';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.queryBus.execute(new GetBlogsQuery(query));
  }

  @ApiBasicAuth('basicAuth')
  @UseGuards(BasicAuthGuard)
  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute<CreateBlogCommand, string>(
      new CreateBlogCommand(body),
    );

    return this.queryBus.execute(new GetBlogByIdQuery(blogId));
  }

  //токен необязательный: нужен только для myStatus в лайках постов
  @ApiBearerAuth()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiParam({ name: 'blogId' }) //для сваггера
  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    return this.queryBus.execute(
      new GetPostsQuery(query, user?.id ?? null, blogId),
    );
  }

  @ApiBasicAuth('basicAuth')
  @UseGuards(BasicAuthGuard)
  @ApiParam({ name: 'blogId' }) //для сваггера
  @Post(':blogId/posts')
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Body() body: CreatePostForBlogInputDto,
  ): Promise<PostViewDto> {
    //если блога нет -> 404
    await this.queryBus.execute(new GetBlogByIdQuery(blogId));

    const postId = await this.commandBus.execute<CreatePostCommand, string>(
      new CreatePostCommand({ ...body, blogId }),
    );

    return this.queryBus.execute(new GetPostByIdQuery(postId, null));
  }

  @ApiParam({ name: 'id' }) //для сваггера
  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.queryBus.execute(new GetBlogByIdQuery(id));
  }

  @ApiBasicAuth('basicAuth')
  @UseGuards(BasicAuthGuard)
  @ApiParam({ name: 'id' }) //для сваггера
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    return this.commandBus.execute(new UpdateBlogCommand(id, body));
  }

  @ApiBasicAuth('basicAuth')
  @UseGuards(BasicAuthGuard)
  @ApiParam({ name: 'id' }) //для сваггера
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute(new DeleteBlogCommand(id));
  }
}
