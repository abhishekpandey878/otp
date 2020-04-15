"use strict";

require('dotenv').config();
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
let databaseName = process.env.DB
mongoose.connect(databaseName);
var {OtpToken} = require('../models/otpToken');


let getDetails = async (s, e) => {
    let startDate = new Date(); // this is the starting date that looks like ISODate("2014-10-03T04:00:00.188Z")
    startDate.setSeconds(0);
    startDate.setHours(0);
    startDate.setMinutes(0);
    let endDate = new Date();

    if(s) {
        startDate = new Date(s);
    }

    if(e) {
        endDate = new Date(e);
        endDate.setSeconds(0);
        endDate.setHours(0);
        endDate.setMinutes(0);
    }

    
    // console.log(startDate, endDate)
    let aggs = await OtpToken.aggregate([
        {
            $match: {
                created_at: {$gte: startDate, $lte: endDate}
            }
        },
        {
            $group: {
                _id: "$verified",
                count: {$sum:1}
            }
        }
    ]);

    console.log(aggs);
    mongoose.connection.close();
}


var args = process.argv.slice(2);
if(args.length){
    if(args[0] == 'help') {
        console.log(`
        node server/utils/report.js mm/dd/yyyy mm/dd/yyyy
        `);
        mongoose.connection.close();
    }else {
        getDetails(...args);
    }
}else{
    getDetails();
}
