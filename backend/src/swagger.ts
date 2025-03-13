import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger定义
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '财务管理系统API',
            version: '1.0.0',
            description: '财务管理系统的RESTful API文档',
        },
        servers: [
            {
                url: 'http://localhost:3001/api',
                description: '开发服务器',
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // 扫描的文件路径
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs }; 