//dto для фабричного метода сущности (domain слой)
export class CreateCommentDomainDto {
  content: string;
  postId: string;
  userId: string;
  userLogin: string;
}
