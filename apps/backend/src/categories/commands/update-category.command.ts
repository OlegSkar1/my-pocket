import { UpdateCategoryDto } from "../dto/update-category.dto";

export class UpdateCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly dto: UpdateCategoryDto,
  ) {}
}
