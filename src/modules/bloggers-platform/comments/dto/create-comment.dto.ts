//dto для usecase (application слой)
export class CreateCommentDto {
  postId: string;
  userId: string;
  content: string;
}
