import { CreateCategoryDto } from "../dto/create-category.dto";

export class CreateCategoryCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateCategoryDto,
  ) {}
}
