// config/swagger.js
const swaggerJSdoc = require('swagger-jsdoc');

// Lấy PORT từ biến môi trường. Render sẽ cung cấp PORT=10000.
// Nếu NODE_ENV là 'production' (trên Render), dùng URL của Render.
// Nếu là 'development' (local), dùng localhost.
const isProduction = process.env.NODE_ENV === 'production';
const BASE_URL = isProduction 
                 ? `https://phuchwa-project.onrender.com/api` // <-- ĐẶT URL RENDER CỦA BẠN VÀ THÊM /api
                 : `http://localhost:${process.env.PORT || 3000}/api`; // <-- Dùng PORT của Node.js backend

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PhucHwa API Documentation', // Tên đẹp hơn
      version: '1.0.0',
      description: 'API documentation for PhucHwa System' // Mô tả chi tiết hơn
    },
    servers: [
      {
        url: BASE_URL // <-- SỬ DỤNG BASE_URL ĐÃ ĐỊNH NGHĨA Ở TRÊN
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpecs = swaggerJSdoc(options);
module.exports = swaggerSpecs;