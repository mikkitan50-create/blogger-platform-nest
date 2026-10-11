//dto для фабричного метода сущности (domain слой)
//blogName берётся из блога в сервисе
export class CreatePostDomainDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
}
