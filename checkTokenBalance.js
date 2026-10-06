// checkTokenBalance.js
require('dotenv').config();
const web3 = require('./config/web3Client'); // Đảm bảo đường dẫn đúng
const { abi: tokenABI } = require('./src/abi/MyToken.json'); // Đảm bảo đường dẫn đúng

async function checkBalances() {
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const elderlyEVMAddress = process.env.ELDERLY_MOCK_EVM_ADDRESS;
    const nurseEVMAddress = process.env.NURSE_MOCK_EVM_ADDRESS;
    console.log(`Token Address: ${tokenAddress}`);
    console.log(`Elderly EVM Address: ${elderlyEVMAddress}`);
    console.log(`Nurse EVM Address: ${nurseEVMAddress}`);

    if (!tokenAddress || !elderlyEVMAddress || !nurseEVMAddress) {
        console.error("Vui lòng cấu hình TOKEN_ADDRESS, ELDERLY_MOCK_EVM_ADDRESS, NURSE_MOCK_EVM_ADDRESS trong .env");
        return;
    }

    try {
        const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
        const elderlyBalance = await tokenContract.methods.balanceOf(elderlyEVMAddress).call();
        const nurseBalance = await tokenContract.methods.balanceOf(nurseEVMAddress).call();
    

        // Chuyển đổi số dư từ Wei (hoặc đơn vị nhỏ nhất của token) sang đơn vị đọc được (ví dụ: ETH)
        // Giả sử token của bạn có 18 số thập phân (như ETH), nếu khác, bạn cần điều chỉnh 'ether'
        const elderlyBalanceFormatted = web3.utils.fromWei(elderlyBalance, 'ether');
        const nurseBalanceFormatted = web3.utils.fromWei(nurseBalance, 'ether');


        console.log(`\n--- Số dư Token ---`);
        console.log(`Địa chỉ Token Contract: ${tokenAddress}`);
        console.log(`Số dư của Elderly (${elderlyEVMAddress}): ${elderlyBalanceFormatted} PHT`);
        console.log(`Số dư của Nurse (${nurseEVMAddress}): ${nurseBalanceFormatted} PHT`);
        console.log(`--------------------\n`);

    } catch (error) {
        console.error("Lỗi khi kiểm tra số dư token:", error);
    }
}

checkBalances();