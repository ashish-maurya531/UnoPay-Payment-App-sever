// utils/scheduler.js
const schedule = require('node-schedule');
const { checkDaily, checkWeekly, checkMonthly } = require('./companyTurnoverDistrubution');

// Daily scheduler - runs every day at 00:01 (12:01 AM)
const dailyJob = schedule.scheduleJob('1 0 * * *', async () => {
    console.log('🏁 Daily scheduler triggered at', new Date());
    try {
        const result = await checkDaily();
        console.log('✅ Daily check result:', result);
    } catch (error) {
        console.error('🚨 Daily scheduler error:', error);
    }
});

// Weekly scheduler - runs every Monday at 00:01 (12:01 AM)
const weeklyJob = schedule.scheduleJob('1 0 * * 1', async () => {
    console.log('🏁 Weekly scheduler triggered at', new Date());
    try {
        const result = await checkWeekly();
        console.log('✅ Weekly check result:', result);
    } catch (error) {
        console.error('🚨 Weekly scheduler error:', error);
    }
});

// Monthly scheduler - runs on 1st of every month at 00:01 (12:01 AM)
// const monthlyJob = schedule.scheduleJob('1 0 1 * *', async () => {
//     console.log('🏁 Monthly scheduler triggered at', new Date());
//     try {
//         const result = await checkMonthly();
//         console.log('✅ Monthly check result:', result);
//     } catch (error) {
//         console.error('🚨 Monthly scheduler error:', error);
//     }
// });

// Initialize schedulers when app starts
console.log('⏰ Schedulers initialized:', {
    daily: dailyJob.nextInvocation(),
    weekly: weeklyJob.nextInvocation(),
    // monthly: monthlyJob.nextInvocation()
});

module.exports = {
    dailyJob,
    weeklyJob,
    // monthlyJob
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////


// // utils/scheduler.js
// const schedule = require('node-schedule');
// const { checkDaily, checkWeekly, checkMonthly } = require('./companyTurnoverDistrubution');

// let currentStep = 0;
// const checkFunctions = [
//     { name: 'Daily', fn: checkDaily },
//     { name: 'Weekly', fn: checkWeekly },
//     { name: 'Monthly', fn: checkMonthly }
// ];

// // Schedule the cyclical job to run every 2 minutes
// const cyclicalJob = schedule.scheduleJob('*/2 * * * *', async () => {
//     try {
//         const currentCheck = checkFunctions[currentStep];
//         console.log(`⏳ [Cycle] Running ${currentCheck.name} check at ${new Date().toISOString()}`);
        
//         const result = await currentCheck.fn();
//         console.log(`✅ [Cycle] ${currentCheck.name} check result:`, result);
        
//         // Move to next step in cycle
//         currentStep = (currentStep + 1) % 3;
        
//     } catch (error) {
//         console.error(`🚨 [Cycle] Error in ${checkFunctions[currentStep].name} check:`, error);
//         currentStep = (currentStep + 1) % 3; // Continue cycle even on error
//     }
// });

// // Initialize with first run time
// console.log('⏰ Cyclical scheduler initialized. First run at:', cyclicalJob.nextInvocation());

// module.exports = {
//     cyclicalJob
// };