import { IsNotEmpty, IsString } from 'class-validator';
import { CreatePostDto } from '../../dto/create-post.dto';
import { Trim } from '../../../../../core/decorators/transform/trim';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  contentConstraints,
  shortDescriptionConstraints,
  titleConstraints,
} from '../../domain/post.entity';

//dto для боди при создании поста для конкретного блога (POST /blogs/{blogId}/posts)
//blogId приходит из url
export class CreatePostForBlogInputDto {
  @IsStringWithTrim(titleConstraints.minLength, titleConstraints.maxLength)
  title: string;

  @IsStringWithTrim(
    shortDescriptionConstraints.minLength,
    shortDescriptionConstraints.maxLength,
  )
  shortDescription: string;

  @IsStringWithTrim(contentConstraints.minLength, contentConstraints.maxLength)
  content: string;
}

//dto для боди при создании поста (POST /posts)
//то, что блог с таким blogId существует, проверяется в usecase
export class CreatePostInputDto
  extends CreatePostForBlogInputDto
  implements CreatePostDto
{
  @IsString()
  @IsNotEmpty()
  @Trim()
  blogId: string;
}
