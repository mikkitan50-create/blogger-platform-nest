import { UpdateBlogDto } from '../../dto/create-blog.dto';

//dto для боди при обновлении блога
export class UpdateBlogInputDto implements UpdateBlogDto {
  name: string;
  description: string;
  websiteUrl: string;
}
