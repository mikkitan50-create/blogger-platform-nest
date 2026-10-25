import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import {
  CommentatorInfo,
  CommentatorInfoSchema,
} from './commentator-info.schema';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import { LikeStatus } from '../../likes/like-status';

//ограничения из swagger, используем и в схеме mongoose, и во входных dto (валидация)
export const commentContentConstraints = {
  minLength: 20,
  maxLength: 300,
};

//флаг timestamps автоматически добавляет поля updatedAt и createdAt
@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, required: true, ...commentContentConstraints })
  content: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: CommentatorInfoSchema, required: true })
  commentatorInfo: CommentatorInfo;

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

  static createInstance(dto: CreateCommentDomainDto): CommentDocument {
    const comment = new this();
    comment.content = dto.content;
    comment.postId = dto.postId;
    comment.commentatorInfo = {
      userId: dto.userId,
      userLogin: dto.userLogin,
    };
    comment.likesCount = 0;
    comment.dislikesCount = 0;

    return comment as CommentDocument;
  }

  /**
   * Изменять и удалять комментарий может только его автор
   */
  isOwner(userId: string): boolean {
    return this.commentatorInfo.userId === userId;
  }

  update(content: string) {
    this.content = content;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
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

export const CommentSchema = SchemaFactory.createForClass(Comment);

//регистрирует методы сущности в схеме
CommentSchema.loadClass(Comment);

//Типизация документа
export type CommentDocument = HydratedDocument<Comment>;

//Типизация модели + статические методы
export type CommentModelType = Model<CommentDocument> & typeof Comment;
