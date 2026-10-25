import { UpdatePostDto } from '../../dto/create-post.dto';
import { CreatePostInputDto } from './posts.input-dto';

//dto для боди при обновлении поста (поля и валидация как при создании)
export class UpdatePostInputDto
  extends CreatePostInputDto
  implements UpdatePostDto {}
