import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';
import { UpdateBlogDto } from '../dto/create-blog.dto';

//ограничения из swagger, используем и в схеме mongoose, и во входных dto (валидация)
export const nameConstraints = {
  minLength: 1,
  maxLength: 15,
};

export const descriptionConstraints = {
  minLength: 1,
  maxLength: 500,
};

export const websiteUrlConstraints = {
  minLength: 1,
  maxLength: 100,
  match: /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
};

//флаг timestamps автоматически добавляет поля updatedAt и createdAt
@Schema({ timestamps: true })
export class Blog {
  @Prop({ type: String, required: true, ...nameConstraints })
  name: string;

  @Prop({ type: String, required: true, ...descriptionConstraints })
  description: string;

  @Prop({ type: String, required: true, ...websiteUrlConstraints })
  websiteUrl: string;

  /**
   * True if user has not expired membership subscription to blog
   * @default false
   */
  @Prop({ type: Boolean, required: true, default: false })
  isMembership: boolean;

  createdAt: Date;
  updatedAt: Date;

  /**
   * Deletion timestamp, if date exist, means entity soft deleted
   */
  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  static createInstance(dto: CreateBlogDomainDto): BlogDocument {
    const blog = new this();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership = false;

    return blog as BlogDocument;
  }

  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  update(dto: UpdateBlogDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

//регистрирует методы сущности в схеме
BlogSchema.loadClass(Blog);

//Типизация документа
export type BlogDocument = HydratedDocument<Blog>;

//Типизация модели + статические методы
export type BlogModelType = Model<BlogDocument> & typeof Blog;
