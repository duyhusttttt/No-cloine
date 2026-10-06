const express = require('express');
const userRoutes = require('./userRoutes');
const nurseRoutes = require('./nurseRoute'); 
const cardRoutes = require('./cardRoute'); 
const elderlyRoutes = require('./elderlyRoute');
const contractRoutes = require('./contractRoute');
const matchingRoutes = require('./matchingRoute');
const testRoutes = require('./testRoute');
const surveyRoutes = require('./surveyRoute'); 
const serviceLogRoutes = require('./serviceLogRoute');
const transactionRoutes = require('./transactionRoute');
const disputeRoutes = require('./disputeRoute');      
const withdrawRequestRoutes = require('./withdrawRequestRoute');
const feedbackRoutes = require('./feedbackRoute');  

const delay = require('../middleware/delay');
const {auth} = require('../middleware/auth'); // Import middleware auth nếu cần
// Nếu có thêm routes khác, import ở đây
// const productRoutes = require('./productRoutes');

const routerAPI = express.Router();

// Áp dụng delay cho tất cả các request vào router này
routerAPI.use(delay);

// Định nghĩa các route con
routerAPI.use('/users', userRoutes);
routerAPI.use('/nurses', auth, nurseRoutes); 
routerAPI.use('/cards', auth, cardRoutes);
routerAPI.use('/elderly', auth, elderlyRoutes);
routerAPI.use('/contract', auth, contractRoutes);
routerAPI.use('/matching', auth, matchingRoutes);
routerAPI.use('/test', auth, testRoutes);
routerAPI.use('/survey', auth, surveyRoutes);
routerAPI.use('/service-logs', auth, serviceLogRoutes);
routerAPI.use('/transactions', auth, transactionRoutes);
routerAPI.use('/disputes', auth, disputeRoutes);
routerAPI.use('/withdraw-requests', auth, withdrawRequestRoutes);
routerAPI.use('/feedbacks', auth, feedbackRoutes);


module.exports = routerAPI;
