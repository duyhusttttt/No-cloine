// config/web3Client.js
const {Web3} = require('web3');
require('dotenv').config();

let web3;
if (process.env.WEB3_PROVIDER_URL) {
    // Sửa lỗi ở đây: chỉ truyền URL trực tiếp vào constructor của Web3
    web3 = new Web3(process.env.WEB3_PROVIDER_URL);
    console.log('Connected to Web3 provider:', process.env.WEB3_PROVIDER_URL);
} else {
    console.warn('WEB3_PROVIDER_URL not set in .env. Web3 functionality will be limited.');
    // Fallback cho phát triển nếu không kết nối được với blockchain thật
    web3 = new Web3(Web3.givenProvider || 'http://localhost:8545'); // Mặc định đến Ganache/node cục bộ
}

module.exports = web3;