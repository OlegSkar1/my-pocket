import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

const mockPrismaService = {
	$connect: jest.fn(),
	$disconnect: jest.fn(),
	user: { findUnique: jest.fn(), create: jest.fn() },
	category: {
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		findMany: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	},
	transaction: {
		findUnique: jest.fn(),
		findFirst: jest.fn(),
		findMany: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		aggregate: jest.fn(),
		groupBy: jest.fn(),
	},
};

describe('AppModule', () => {
	let moduleRef: TestingModule;

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(PrismaService)
			.useValue(mockPrismaService)
			.compile();
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('должен скомпилироваться без ошибок', () => {
		expect(moduleRef).toBeDefined();
	});

	it('должен предоставлять AppService', () => {
		const service = moduleRef.get(AppService);
		expect(service).toBeDefined();
	});

	it('должен предоставлять AppController', () => {
		const controller = moduleRef.get(AppController);
		expect(controller).toBeDefined();
	});

	describe('AppController.getHealth', () => {
		it("должен вернуть { status: 'ok' }", () => {
			const controller = moduleRef.get(AppController);
			expect(controller.getHealth()).toEqual({ status: 'ok' });
		});
	});
});
