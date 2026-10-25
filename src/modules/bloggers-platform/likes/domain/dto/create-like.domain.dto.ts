import { LikeStatus } from '../../like-status';

//dto для фабричного метода сущности (domain слой)
export class CreateLikeDomainDto {
  parentId: string;
  userId: string;
  userLogin: string;
  status: LikeStatus;
}
