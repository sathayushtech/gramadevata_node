import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Gramadevata API',
    description: 'API documentation for Gramadevata.',
    version: '1.0.0',
  },
  tags: [
    { name: 'Comment' },
    { name: 'Village' },
  ],
  host: 'localhost:' + (process.env.PORT || 3000),
  schemes: ['http'],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);
