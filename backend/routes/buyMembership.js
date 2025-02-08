const express = require('express');
const { pool } = require('../config/database');
const axios = require('axios');
const router = express.Router();
const generateTransactionId = require('../utills/generateTxnId');
const {getFlexiWalletBalance} = require('../utills/checkUserBalance');
const {commisionPayout} = require('../utills/commisionPayout');
const containsSQLInjectionWords=require('../utills/sqlinjectioncheck');
const {recreateRankTable,updateRankAndBacktrack} = require('../utills/rankBuilder')
const {getMembershipTransactionsForToday,getMembershipTransactionsForWeek,getMembershipTransactionsForMonth,}= require('../utills/companyTurnover');
const {distributeDailyrankIncome,distributeWeeklyrankIncome,distributeMonthlyrankIncome} = require('../utills/companyTurnoverDistrubution.js'); 
const {handleMagicPlant,moneyPlantHoldTransactionsCheck}=require('../utills/magicPlant');
const authenticateToken = require('../middleware/auth');


// handleMagicPlant("UP103841");
// handleMagicPlant("UP109736");
// handleMagicPlant("UP109756");
// handleMagicPlant("UP109716");
// handleMagicPlant("UP109776");
// handleMagicPlant("UP109786");
// handleMagicPlant("UP109396");
// handleMagicPlant("a");
// handleMagicPlant("b");
// handleMagicPlant("c");
// handleMagicPlant("d");
// handleMagicPlant("e");
// handleMagicPlant("f");
// handleMagicPlant("g");
// handleMagicPlant("h");
// handleMagicPlant("i");
// handleMagicPlant("j");
// handleMagicPlant("k");
// handleMagicPlant("l");
// handleMagicPlant("m");
// handleMagicPlant("n");
// handleMagicPlant("o");
// handleMagicPlant("p");
// handleMagicPlant("q");
// handleMagicPlant("r");
// handleMagicPlant("s");
// handleMagicPlant("t");
// handleMagicPlant("u");
// handleMagicPlant("v");
// handleMagicPlant("w");
// handleMagicPlant("x");
// handleMagicPlant("y");
// handleMagicPlant("z");
// handleMagicPlant("aa");
// handleMagicPlant("ab");
// handleMagicPlant("ac");
// handleMagicPlant("ad");
// handleMagicPlant("ae");





// distributeDailyrankIncome()
// distributeWeeklyrankIncome()
// distributeMonthlyrankIncome()






// getMembershipTransactionsForToday();
// getMembershipTransactionsForWeek()
// getMembershipTransactionsForMonth()
// Usage example:
// recreateRankTable()
// updateRankAndBacktrack('UP183373');


//api for mobile recharge

// console.log(commisionPayout("","UP109796",""));

// //call the function
// const balance = getFlexiWalletBalance("UP100070");
// console.log(balance);




// route to by membership plan 
router.post('/buymembership', authenticateToken,async (req, res) => {
    const { package_name, member_id } = req.body;

    // Validate input
    if (!package_name || !member_id) {
        return res.status(400).json({ status: 'false', error: 'All required fields must be provided.' });
    }

    // Check for SQL injection
    const checkFields = [package_name, member_id].join(' ');
    if (containsSQLInjectionWords(checkFields)) {
        return res.status(400).json({ status: "false", error: "Don't try to hack !" });
    }
   
    const [packageRows] = await pool.query(
        `SELECT * FROM list_of_packages WHERE package_name = ?`,
        [package_name]
    );
    if (!packageRows.length) {
        return res.status(404).json({ status: 'false', error: 'Invalid package name' });
    }
    connection = await pool.getConnection();
    try {
        // Check if member_id exists
        const [userRows] = await pool.query(
            `SELECT memberid, membership,status FROM usersdetails WHERE memberid = ?`,
            [member_id]
        );
        if (!userRows.length) {
            return res.status(404).json({ status: 'false', error: 'Invalid member ID.' });
        }
        if (userRows[0].status==="inactive"){
            return res.status(400).json({ status: 'false', error: 'Your account is inactive.' });
        }
        if (userRows[0].membership==="BASIC" & package_name==="BASIC"){
            return res.status(400).json({ status: 'false', error: 'You are already a basic member.' });
        }
        if (userRows[0].membership==="FREE" & package_name==="PREMIUM"){
            return res.status(400).json({ status: 'false', error: 'You are not eligible for premium membership. First Buy Basic ' });
        }
        
        if (userRows[0].membership==="PREMIUM"){
            return res.status(400).json({ status: 'false', error: 'You are already a premium member.' });

        }
        
      
        const price = packageRows[0].price;
        //total price with gst
        const total_price = packageRows[0].total_price;

      
        const userflexiBalance = await getFlexiWalletBalance(member_id);
        if (userflexiBalance < total_price) {
            return res.status(400).json({ status: 'false', error: 'Insufficient balance.' });
        }
       
        const txn_id = generateTransactionId();
        try {
           
            
            await connection.beginTransaction();
           
            const [rows] = await connection.query(
                `INSERT INTO universal_transaction_table (transaction_id, member_id, type, subType,amount, status,message)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [txn_id, member_id, 'Membership', package_name, total_price, 'success', 'Membership Buyed Successfully']
            );
            if (rows.affectedRows>0) {
                console.log('Addition in universal transaction done successfully');
                }
            
            const [rows1] = await connection.query(
                `INSERT INTO flexi_wallet (member_id,transaction_id, credit, debit) VALUES (?, ?, ?, ?)`,
                [member_id,txn_id, 0.00, total_price]
            );
            if (rows1.affectedRows>0) {
                console.log('Addition in flexi wallet done successfully');
                }
        
            const [rows3] = await connection.query(
                `UPDATE users_total_balance SET user_total_balance = user_total_balance - ? WHERE member_id = ?`,
                [total_price, member_id]
                );
            if (rows3.affectedRows>0) {
                console.log('User total balance updated successfully');
                }
           
            const [rows2] = await connection.query(
                `UPDATE usersdetails SET membership = ? WHERE memberid = ?`,
                [package_name, member_id]
                );
            if (rows2.affectedRows>0) {
                console.log('Membership updated successfully');

                const commission_done=await commisionPayout(txn_id,package_name, member_id, price);
                if (commission_done) {
                    console.log('Commision distributed successfully');
                    }

                }
           

            


            
            //commit the transaction
            await connection.commit();

            // Step 2: Send success response
            res.status(200).json({ status: 'success', message: 'Membership purchased successfully.' });
    
            // Step 3: Update rank and backtrack
            await updateRankAndBacktrack(member_id);
            console.log(`✅ Rank update completed for ${member_id}`);
    
            // Step 4: Check if member already exists in magic_plant_levels
            const [magicPlantMember] = await pool.query(
                "SELECT COUNT(*) AS count FROM magic_plant_levels WHERE JSON_CONTAINS(member_list, ?)",
                [JSON.stringify(member_id)]
            );
    
            if (magicPlantMember[0].count > 0) {
                console.log(`⚠️ ${member_id} already exists in magic_plant_levels. Skipping handleMagicPlant.`);
            } else {
                // Step 5: If not found, add member to Magic Plant
                console.log(`🚀 Adding ${member_id} to Magic Plant Levels`);
                await handleMagicPlant(member_id);
                console.log(`✅ Magic Plant Levels updated for ${member_id}`);
            }
    
            // Step 6: Check and process held transactions for the member in Money Plant
            console.log(`🔍 Checking held transactions for ${member_id} in Money Plant`);
            await moneyPlantHoldTransactionsCheck(member_id);
            console.log(`✅ Held transactions processed for ${member_id}`);

        }
        catch (error) {
            console.error(error);
            // Rollback the transaction
            await connection.rollback();
            return res.status(500).json({ status: 'failed', error: 'Error while purchasing membership.' });
            }






    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'failed', error: 'Internal Server Error' });
    }
    finally {
        // Release the connection
        if (connection) connection.release();
    
    }
});

module.exports = router;
        
