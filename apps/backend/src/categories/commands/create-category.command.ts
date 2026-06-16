import { CreateCategoryDto } from "../dto/create-category.dto";

/** Команда создания категории. Диспатчится из `CategoriesController.create`. */
export class CreateCategoryCommand {
  /**
   * @param userId - id владельца категории
   * @param dto - данные новой категории
   */
  constructor(
    public readonly userId: string,
    public readonly dto: CreateCategoryDto,
  ) {}
}
