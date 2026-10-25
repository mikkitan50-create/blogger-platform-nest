import { Matches } from 'class-validator';
import { UpdateBlogDto } from '../../dto/create-blog.dto';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  descriptionConstraints,
  nameConstraints,
  websiteUrlConstraints,
} from '../../domain/blog.entity';

//dto для боди при обновлении блога
export class UpdateBlogInputDto implements UpdateBlogDto {
  @IsStringWithTrim(nameConstraints.minLength, nameConstraints.maxLength)
  name: string;

  @IsStringWithTrim(
    descriptionConstraints.minLength,
    descriptionConstraints.maxLength,
  )
  description: string;

  @IsStringWithTrim(
    websiteUrlConstraints.minLength,
    websiteUrlConstraints.maxLength,
  )
  @Matches(websiteUrlConstraints.match)
  websiteUrl: string;
}
