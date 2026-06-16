import { UpdateCategoryDto } from "../dto/update-category.dto";

/** Команда обновления категории. Диспатчится из `CategoriesController.update`. */
export class UpdateCategoryCommand {
  /**
   * @param id - UUID обновляемой категории
   * @param userId - id владельца (для изоляции)
   * @param dto - поля для обновления
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly dto: UpdateCategoryDto,
  ) {}
}
