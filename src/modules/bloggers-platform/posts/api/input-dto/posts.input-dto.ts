//dto для боди при создании поста (POST /posts)
export class CreatePostInputDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

//dto для боди при создании поста для конкретного блога (POST /blogs/{blogId}/posts)
//blogId приходит из url
export class CreatePostForBlogInputDto {
  title: string;
  shortDescription: string;
  content: string;
}
