var request = require('request-promise');
var {OtpToken} = require('../models/otpToken');


/**
 * Check if the requesting store is permitted
 * @param {String} store - store name having myshopify domain name without http
*/

let checkStore = (store) => {
    // getting the available stores
    let status = {'msg': 'ok', "status": 200};
    var stores_local = process.env.STORES;
    if(!stores_local){
        status.msg = 'cannot send otp';
        status.status = 500;
        return status;
    }

    var stores_temp = stores_local.split(",");
    var stores = [];

    stores_temp.forEach( (s) => {
        stores.push(s.trim());
    });

    // var store = req.body.store;
    if(store && typeof(store)) {
        store = store.trim();
    }

    if(stores.indexOf(store) == -1){
        status.msg = 'service unavailable';
        status.status = 401;
        return status;
    }

    return status;
}


/**
 * Handler to verify the number
 * @param {Request} req 
 * @param {Response} res 
 */
exports.verifyNumber = async (req, res) => {

    // check if requester has the permission
    var store = req.body.store;
    let status = checkStore(store);
    if(status.status != 200) {
        return res.send(status);
    }

    // sending sms
    try{
        var number = req.body.number;
        number = number.substr(number.length - 10);
        number = "+91" + number;
        var otp = req.body.otp;
        try{
            var requester = req.get('origin').split("//")[1];
        } catch(e) {
            requester = 'localhost';
        }
    
        console.log('verification: '+ number);
        let doc = undefined;
        try {
            doc = await OtpToken.findOne(
                { phone_number:number, verified:false, shop_url:requester, time_limit_exceeded:false, store:store},
                {}, 
                { sort: { 'created_at' : -1 } }
            );

            // console.log(doc)
            if(doc){
                // if otp didn't match
                if(doc.code != otp) {
                    let count = doc.try_count;
                    doc.try_count = count+1;
                    if(doc.try_count_details){
                        doc.try_count_details.push({
                            try_count: count+1,
                            code: otp
                        });
                        doc.markModified('try_count_details');
                    }
                    doc.updated_at = Date.now();
                    await doc.save();
                    return res.status(400).send({'msg': 'wrong otp!'});
                }

                // else otp matched
                let count = doc.try_count;
                doc.try_count = count+1;
                doc.verified = true;
                doc.updated_at = Date.now();
                // doc.store = store;

                if(doc.try_count_details) {
                    doc.try_count_details.push({
                        try_count: count+1,
                        code: otp
                    });
                    doc.markModified('try_count_details');
                }
    
                timeDifference = Math.floor( Math.abs((doc.created_at.getTime() - doc.updated_at.getTime())/1000) );
                console.log({timeDifference});

                // 5 minutes to enter the otp, expire/delete the entry
                if(timeDifference<300){
                    doc.verified_in_seconds = timeDifference;
                    await doc.save();
                    return res.send({'msg':'success'}); 
                }else{
                    // delete the unncessary data
                    doc.time_limit_exceeded = true;
                    doc.verified = false;
                    await doc.save();
                    res.status(406).send({'msg':'time exceeded 5 minutes'});
                }
                
            }else{
                // console.log(requester);
                // console.log(req.body.otp);
                return res.status(400).send({'msg': 'Phone number did not match, retry or request OTP again'});
                // res.send(err);
            }
        } catch (error) {
            console.log(error);
            return res.status(500).send({"msg": "internal server error, please try again"});
        }
    } catch (e) {
        res.status(500);
        res.send({'msg':'could not verify the otp'});
    }

}



/**
 * handler to send OTP 
 * @param {request} req 
 * @param {Response} res 
 */
exports.sendSms = (req, res) => {
    var key = process.env.SMS_API_KEY;

    console.log(req.body.store);
    console.log(req.body.number);

    var store = req.body.store;
    let status = checkStore(store);
    if(status.status != 200) {
        return res.send(status);
    }

    // sending otp

    var numberTo = req.body.number;
    numberTo = numberTo.substr(numberTo.length - 10);
    numberTo = "+91" + numberTo;
    console.log(`sending otp to ${numberTo}`);
    
    // res.send(req.connection.remoteAddress);
    // return;
    var otp = Math.floor(1000 + Math.random() * 9000);
    var api = `https://2factor.in/API/V1/${key}/SMS/${numberTo}/${otp}/OTP`;
    
    try{
        var requester = req.get('origin').split("//")[1];
    } catch(e) {
        requester = 'localhost';
    }
    

    request({
        "method":"GET", 
        "uri": api,
      }).then(function(data) {
         data = JSON.parse(data);
            try{
                console.log(data);
                var otpToken = new OtpToken({
                    phone_number: numberTo,
                    code: otp.toString(),
                    session_id: data.Details,
                    shop_url:requester,
                    verified: false,
                    created_at: Date.now(),
                    store: store
                });
    
                otpToken.save().then( (doc) => {
                    res.send({'msg':'success'});
                }, (err) => {
                    res.status(500);
                    res.send({'msg': 'server error'});
                });
            } catch (e) {
                res.status(500);
                res.send({'msg': 'error while sending otp'});
            }
      }).catch( (err) => {

        res.status(400);
          res.send({'msg': 'err'});
          console.log(err);
      });
}


/**
 * Sample method that will update the delivery report
 * Handler to get the report of sent sms
 * @param {Request} req 
 * @param {Response} res 
 */
exports.report = (req, res) => {

    try{
        session_id = req.query.MID;
        phone_number = req.query.Dest;
        stime = req.query.Stime;
        dtime = req.query.Dtime;
        b_status = req.query.Status;
        b_reason = req.query.Reason;
        b_operator = req.query.Operator;
        b_circle = req.query.Circle;
        b_type = req.query.Type;
    
        OtpToken.findOne({session_id:session_id},{}, { sort: { 'created_at' : -1 } }, function(err, doc){
            if(err) {
                res.send({'msg': 'an error occured while saving delivery report!'});
            }
            if(doc){
                // update the doc
                doc.stime = stime;
                doc.dtime = dtime;
                doc.b_status = b_status;
                doc.b_reason = b_reason;
                doc.b_operator = b_operator;
                doc.b_circle = b_circle;
                doc.b_type = b_type;
                doc.save().then( (saved) => {
                    console.log('delivery report saved');
                    res.send({'msg':'success'});
                });
            }else{
                res.status(400).send({'msg': 'otp sent from another location.'});
                // res.send(err);
            }
        });

    } catch(e) {
        res.status(400);
        res.send({'msg':'err'});
    }
    
    console.log(req.query);
}


/**
 * Not being used as there is no dashboard
 * Showing admin all OTPs sent to their customer
 * pagination added
 * @param {Request} req 
 * @param {Response} res 
 */  

exports.getAllOtpSms = async (req, res) => {
    let page_number = 1;
    let page_size = 20;
    let sortBy = {};
    let search = {};
    
    if(req.query.page_number){
        page_number = req.query.page_number;
    }
    
    if(req.query.page_size){
        page_size = req.query.page_size;
    }
    

    if(req.query.sortBy){
        req.query.order == 'asc' ? sortBy[req.query.sortBy] = 1 : sortBy[req.query.sortBy] = -1;
    }else{
        sortBy["created_at"] = 1;
    }

    if(req.query.search) {
        /**
         * Search for a Phrase
         * 
         * To match the exact phrase as a single term, escape the quotes.
         * Eg:- db.articles.find( { $text: { $search: "\"coffee shop\"" } } )
         */
        search = {$text: {$search: '"'+req.query.search+'"'}};
    }


    let totalOtpTokens = await OtpToken.countDocuments({});

    // console.log(sortBy);
    OtpToken.find({}).limit(page_size).skip((page_number-1)*page_size).sort(sortBy)
    .then( (doc) => {
        // console.log(doc.length);
        res.render('otp.hbs', 
           {doc, search:req.query.search, sortBy:req.query.sortBy, order:req.query.order, totalOtpTokens:totalOtpTokens}
        );
    })
    .catch( (err) => {
        res.status(500);
        res.send(err);
    });
}  