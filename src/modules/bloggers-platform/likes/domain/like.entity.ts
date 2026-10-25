import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { LikeStatus } from '../like-status';
import { CreateLikeDomainDto } from './dto/create-like.domain.dto';

/**
 * Like Entity Schema
 * Лайк (или дизлайк) одного юзера для поста или комментария.
 * Один юзер - один документ на каждый пост/комментарий, статус меняется методом updateStatus
 */
@Schema({ timestamps: true })
export class Like {
  /**
   * id поста или комментария
   */
  @Prop({ type: String, required: true })
  parentId: string;

  @Prop({ type: String, required: true })
  userId: string;

  /**
   * логин храним сразу, чтобы для newestLikes не ходить в коллекцию юзеров
   */
  @Prop({ type: String, required: true })
  userLogin: string;

  @Prop({ type: String, enum: LikeStatus, required: true })
  status: LikeStatus;

  createdAt: Date;

  /**
   * updatedAt меняется при каждой смене статуса, используем как время лайка (addedAt)
   */
  updatedAt: Date;

  static createInstance(dto: CreateLikeDomainDto): LikeDocument {
    const like = new this();
    like.parentId = dto.parentId;
    like.userId = dto.userId;
    like.userLogin = dto.userLogin;
    like.status = dto.status;

    return like as LikeDocument;
  }

  updateStatus(status: LikeStatus) {
    this.status = status;
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);

//регистрирует методы сущности в схеме
LikeSchema.loadClass(Like);

//Типизация документа
export type LikeDocument = HydratedDocument<Like>;

//Типизация модели + статические методы
export type LikeModelType = Model<LikeDocument> & typeof Like;
