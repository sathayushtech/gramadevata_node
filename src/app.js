import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json' assert { type: 'json' };
import gramadevataRouter from './routes/gramadevataRouter.js';

const app = express();

app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

app.use('/', gramadevataRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});