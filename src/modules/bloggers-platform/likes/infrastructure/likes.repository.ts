import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument, LikeModelType } from '../domain/like.entity';

@Injectable()
export class LikesRepository {
  constructor(@InjectModel(Like.name) private LikeModel: LikeModelType) {}

  findByParentAndUser(
    parentId: string,
    userId: string,
  ): Promise<LikeDocument | null> {
    return this.LikeModel.findOne({ parentId, userId });
  }

  async save(like: LikeDocument) {
    await like.save();
  }
}
