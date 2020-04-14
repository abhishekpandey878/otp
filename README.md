# Create a new node/aws ec2 instance and login

Update packages
```
sudo apt-get update
```


# Install nodejs & pm2

```
1  sudo apt-get update
2  curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
3  sudo apt-get install -y nodejs
4  sudo npm install nodemon -g
5  sudo npm install -g pm2
```
## pm2 blog post
https://keymetrics.io/2015/03/26/pm2-clustering-made-easy/


# Install NginX

```
1  sudo apt-get install nginx
2  sudo nano /etc/nginx/sites-available/default
3  sudo nginx -t
4  sudo systemctl restart nginx
```

### Nginx Configuration

```
sudo nano /etc/nginx/sites-available/default
```

what need to be changed ?

1. Add upstream block at top

Here we will expose our app running on port 8000 to port 80 with nginx.
So if your app is running on some different port, you can change is here

```
upstream node_app{
        server 127.0.0.1:8000;
}
```

2. give a server_name a name


```
server_name _;
```

to 

```
server_name otp.mydomain.com;
```

3. set location to your static files

Let nginx serve static files.

> Note: In case of cod otp app, this is not needed. but you can always set this up

```
root /var/www/codotp;
```

4. Edit 'location /' block

Lets tell Nginx to reverse proxy to our app running on port 8000 by using
proxy_pass http://node_app;

Also set some required headers

```
location / {
            proxy_pass http://node_app;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
```        


> File will look like: 

```
# *****************************
## add the below upstream block
upstream node_app{
        server 127.0.0.1:8000;
}

server {
        listen 80 default_server;
        listen [::]:80 default_server;

        root /var/www/codotp;  # change it to where your static files are located

        # Add index.php to the list if you are using PHP
        index index.html index.htm index.nginx-debian.html;

        server_name otp.mydomain.com;

        location / {
            proxy_pass http://node_app;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
.
.
.
.

```


Troubleshooting NginX

Job for nginx.service failed because the control process exited with error code. See "systemctl status nginx.service" and "journalctl -xe" for details.

-> see if there are multiple files available in site-enabled folder
-> see if there are multiple configuration/files for same server/ip in sites-available
-> dont remove index.php from index entry if its already therey



# Install MongoDB

```
1. sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
2. echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
3. sudo apt-get update
4. sudo apt-get install -y mongodb-org
5. sudo service mongod start
```

# node js project setup

move to a directory

```
cd /var/www
```

you can install wherever you want to install it

1. sudo git clone https://github.com/faruqneo/OTP.git // just an example
2. cd OTP/
3. npm install
4. touch .env

and details on .env file

```
STORES=YOUR_STORE_NAME
SMS_API_KEY=YOUR_ID
```

5. go to sendSms method in smsController.js

add your template name for different stores 

var api = `https://2factor.in/API/V1/${key}/SMS/${numberTo}/${otp}/TEMPLATE_NAME`;

6. Start the server
pm2 start server/server.js

in cluster mode:

pm2 start server/server.js -i max

## check if your app running
```
pm2 log
or
pm2 monit
or 
pm2 status
```



# Installing SSL (using certbot)

## step 1: install certbot
```
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install python-certbot-nginx
```

## Step 2: Obtaining an SSL Certificate

```
sudo certbot --nginx -d otp.mydomain.com
```
where www.example.com is the domain name where you want to have your server running

## Step 3: Setting up Nginx

```
sudo nano /etc/nginx/sites-available/default
```

Find the existing server_name line and replace the underscore, _, with your domain name:

> /etc/nginx/sites-available/default

```
server_name otp.mydomain.com;
```

```
sudo nginx -t
sudo systemctl reload nginx
```




# API

## Request an OTP

```
POST /api/otp
{
    store: "YOUR_STORE_NAME",
    number: "xxxxxxxxxx"
}
```

- Response:

200 OK

- other responses:

Database connectivity issues

```
500
{'msg': 'server error'}

500
{'msg': 'error while sending otp'}
```

if requesting from non-whitelisted domains
```
401
{'msg':'service unavailable'}
```

if whitelisted store names not present in .env file

```
500
{'msg':'cannot send otp'}
```


```
{'msg':'success'}
```

## Verify the number

```
POST /api/otp/verify
{
    store: "YOUR_STORE_NAME",
    number: "xxxxxxxxxx",
    otp: "xxxx"
}
```

- Success response

```
200
{'msg':'success'}
```

- Other responses


if requesting from non-whitelisted domains

```
401
{'msg':'service unavailable'}
```

if whitelisted store names not present in .env file

```
500
{'msg':'cannot send otp'}
```

if otp didn't match

```
400
{'msg': 'wrong otp!'}
```

if otp was not entered within 5 minutes

```
406
{'msg':'time exceeded 5 minutes'}
```

if user enters different number to verify otp

```
400
{'msg': 'Phone number did not match, retry or request OTP again'}
```

if couldn't connect to database internally

```
500
{"msg": "internal server error, please try again"}
```

global error

```
500
{'msg':'could not verify the otp'}
```



# Getting report from command line

go to project root folder

in your console type and hit 

node server/utils/report.js 09/04/2018 09/05/2018

> note: Dates are in format mm/dd/yyyy

> Both arguments are optional


- Getting today's report 

node server/utils/report.js

- getting report from 09/04/2018

node server/utils/report.js 09/04/2018

- getting report from 09/04/2018 to 09/05/2018

node server/utils/report.js 09/04/2018 09/05/2018


> Entered dated count from midnight



Response:

```
[ { _id: false, count: 656 }, { _id: true, count: 1590 } ]
```

{ _id: false, count: 656 } => 656 numbers were not verified

{ _id: true, count: 1590 } => 1590 numbers got verified