import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { commentContentConstraints } from '../../domain/comment.entity';

//dto для боди при создании и обновлении комментария
export class CommentInputDto {
  @IsStringWithTrim(
    commentContentConstraints.minLength,
    commentContentConstraints.maxLength,
  )
  content: string;
}
