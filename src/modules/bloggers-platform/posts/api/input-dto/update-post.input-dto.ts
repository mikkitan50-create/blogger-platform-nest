import { UpdatePostDto } from '../../dto/create-post.dto';

//dto для боди при обновлении поста
export class UpdatePostInputDto implements UpdatePostDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}
