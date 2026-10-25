import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { UpdatePostDomainDto } from './dto/update-post.domain.dto';
import { LikeStatus } from '../../likes/like-status';

//ограничения из swagger, используем и в схеме mongoose, и во входных dto (валидация)
export const titleConstraints = {
  minLength: 1,
  maxLength: 30,
};

export const shortDescriptionConstraints = {
  minLength: 1,
  maxLength: 100,
};

export const contentConstraints = {
  minLength: 1,
  maxLength: 1000,
};

//флаг timestamps автоматически добавляет поля updatedAt и createdAt
@Schema({ timestamps: true })
export class Post {
  @Prop({ type: String, required: true, ...titleConstraints })
  title: string;

  @Prop({ type: String, required: true, ...shortDescriptionConstraints })
  shortDescription: string;

  @Prop({ type: String, required: true, ...contentConstraints })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string;

  /**
   * Количество лайков и дизлайков (сами лайки хранятся в отдельной коллекции likes)
   */
  @Prop({ type: Number, required: true, default: 0 })
  likesCount: number;

  @Prop({ type: Number, required: true, default: 0 })
  dislikesCount: number;

  createdAt: Date;
  updatedAt: Date;

  /**
   * Deletion timestamp, if date exist, means entity soft deleted
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreatePostDomainDto): PostDocument {
    const post = new this();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.likesCount = 0;
    post.dislikesCount = 0;

    return post as PostDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  update(dto: UpdatePostDomainDto) {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
    this.blogId = dto.blogId;
    this.blogName = dto.blogName;
  }

  /**
   * Пересчитывает счетчики, когда юзер меняет свой статус (например Like -> Dislike)
   */
  updateLikesCount(oldStatus: LikeStatus, newStatus: LikeStatus) {
    if (oldStatus === LikeStatus.Like) this.likesCount--;
    if (oldStatus === LikeStatus.Dislike) this.dislikesCount--;

    if (newStatus === LikeStatus.Like) this.likesCount++;
    if (newStatus === LikeStatus.Dislike) this.dislikesCount++;
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

//регистрирует методы сущности в схеме
PostSchema.loadClass(Post);

//Типизация документа
export type PostDocument = HydratedDocument<Post>;

//Типизация модели + статические методы
export type PostModelType = Model<PostDocument> & typeof Post;
