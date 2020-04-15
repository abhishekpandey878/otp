const path = require("path");
const dotenv = require('dotenv').config();
const querystring = require('querystring');
const express = require("express");
const hbs = require('hbs');
const mongoose = require('mongoose');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 8000;

mongoose.Promise = global.Promise;
const dbUri = process.env.DB;

let shopName = process.env.STORES;

const app = express();
app.set('trust proxy', 'loopback');


app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.set('view engine', 'hbs');
app.use(express.static(publicPath));


app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


// Global error handler  
app.use((err, req, res, next) => {
    if (!err) {
        return next();
    }

    res.status(500);
    res.json({ msg: "error", data: err });
});

// var {User} = require('./models/user');

var smsController = require('./controllers/smsController');

// sending the otp
app.post('/api/otp', smsController.sendSms);

// verifying the otp
app.post('/api/otp/verify', smsController.verifyNumber);


/**
 * API route, but used in handlebars template
*/
// app.get('/otp-sms',isAdmin, smsController.getAllOtpSms);

app.get('/', async (req, res) => {
    try {
        shopName = shopName.split(".")[0];
        res.render('index.hbs', { shopName: shopName });
    } catch (error) {
        console.log(error)
    }

});


app.listen(8000, () => {
    mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(res => console.log(`server is running on port ${port}\nConnected with db.`))
        .catch(err => console.log('Unable to connected with db.'))
});
