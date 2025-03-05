// utils/scheduler.js
const schedule = require('node-schedule');
const { checkDaily, checkWeekly } = require('./companyTurnoverDistrubution');

let jobs = {}; // Stores active scheduler jobs

/**
 * Initializes and schedules jobs only for PM2 instance 0
 */
function initializeSchedulers() {
    if (process.env.NODE_APP_INSTANCE !== '0') {
        console.log(`⚠️ Schedulers disabled for instance ${process.env.NODE_APP_INSTANCE}`);
        return;
    }

    console.log('✅ Schedulers enabled for instance 0');

    // Define job configurations
    const schedulersConfig = [
        {
            name: 'dailyJob',
            cron: '1 0 * * *', // Runs daily at 00:01 AM
            task: checkDaily
        },
        {
            name: 'weeklyJob',
            cron: '5 0 * * 1', // Runs every Monday at 00:05 AM
            task: checkWeekly
        }
        
        // {
        //     name: 'testJob',
        //     cron: '0 * * * * *', // Runs every second (for testing)
        //     task: async () => console.log(`🛠 Test Job Triggered at: ${new Date()}`)
        // }
    ];

    // Schedule all jobs dynamically
    schedulersConfig.forEach(({ name, cron, task }) => {
        jobs[name] = schedule.scheduleJob(cron, async () => {
            console.log(`⏳ ${name} started at`, new Date());
            try {
                await task();
                console.log(`✅ ${name} completed successfully.`);
            } catch (error) {
                console.error(`🚨 Error in ${name}:`, error);
            }
        });
    });

    // Log next job execution times
    console.log('⏰ Schedulers initialized:', Object.keys(jobs).reduce((acc, job) => {
        acc[job] = jobs[job].nextInvocation();
        return acc;
    }, {}));
}

initializeSchedulers();

module.exports = jobs;



//////////////////////////////////////////////////////////////////////////////////////////////////////////


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

// const testJob = schedule.scheduleJob('0 * * * * *', () => {
//     console.log('Hello World! (Triggered at:', new Date(), ')');
//   });'




