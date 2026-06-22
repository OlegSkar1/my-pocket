import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
		credentials: true,
	});
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

	const config = new DocumentBuilder()
		.setTitle('My Pocket API')
		.setDescription('Трекер личных расходов — REST API')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

	const port = process.env.PORT ?? 3001;
	await app.listen(port);
}

void bootstrap();
