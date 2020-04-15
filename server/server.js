const path = require("path");
const http = require("http");
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 8000;
const dotenv = require('dotenv').config();

const querystring = require('querystring');

const express = require("express");

const hbs = require('hbs');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const dbUri = process.env.DB;
mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });

let shopName = process.env.STORES;

var app = express();
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

// to use socket.io we need http server
var server = http.createServer(app);
// var io = socketIO(server);
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
    res.send(err);
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

app.get('/', (req, res) => {
    shopName = shopName.split(".")[0];
    res.render('index.hbs', { shopName: shopName });
});


server.listen(8000, () => {
    console.log(`server is running on port ${port}`);
});
