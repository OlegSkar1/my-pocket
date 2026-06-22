import { Test, TestingModule } from '@nestjs/testing';
import { Category } from '@prisma/client';
import { GetCategoriesHandler } from './get-categories.handler';
import { CategoriesService } from '../../categories.service';
import { GetCategoriesQuery } from '../get-categories.query';

const CATEGORY_FIXTURE: Category = {
	id: '00000000-0000-0000-0000-000000000001',
	name: 'Продукты',
	color: '#4CAF50',
	icon: 'shopping-cart',
	userId: '00000000-0000-0000-0000-000000000002',
	createdAt: new Date('2024-01-01'),
	updatedAt: new Date('2024-01-01'),
};

describe('GetCategoriesHandler', () => {
	let handler: GetCategoriesHandler;
	let service: jest.Mocked<CategoriesService>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GetCategoriesHandler,
				{
					provide: CategoriesService,
					useValue: { findManyByUser: jest.fn() },
				},
			],
		}).compile();

		handler = module.get<GetCategoriesHandler>(GetCategoriesHandler);
		service = module.get(CategoriesService) as jest.Mocked<CategoriesService>;
	});

	it('должен делегировать вызов сервису и вернуть список категорий', async () => {
		const userId = '00000000-0000-0000-0000-000000000002';
		service.findManyByUser.mockResolvedValue([CATEGORY_FIXTURE]);

		const result = await handler.execute(new GetCategoriesQuery(userId));

		expect(service.findManyByUser).toHaveBeenCalledWith(userId);
		expect(result).toEqual([CATEGORY_FIXTURE]);
	});
});
