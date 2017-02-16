var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');      // used to create, sign, and verify tokens
var config = require('./config');
var User = require('./app/models/user');

/**
 * CONFIGURATION
 */

var port = process.env.PORT || 8080;
mongoose.connect(config.database);      //connecting to database
app.set('superSecret', config.secret);  //setting create variable

app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());

app.use(morgan('dev'));     //using morgan to log requests 


/**
 * ROUTES
 */

app.get('/', function(req, res) {
    res.send('This API is at http://localhost:' + port + '/api');
});

//Creating a sample user
app.get('/setup', function(req, res)    {
    var uddish = new User({
        name: 'Uddish', 
        password: 'kiiara', 
        admin: true
    });

    //saving the sample user
    uddish.save(function(err)   {
        if(err) throw err;

        console.log('User saved successfully');
        res.json({ success: true });
    });
});

//Showing the users
var apiRoutes = express.Router();

// Route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res)  {
    //finding the user
    User.findOne({
        name: req.body.name
        }, function(err, user)  {
            if(err) throw err;

            if(!user)   {
                res.json({success : false, message : 'User Not Found!'});
            }
            else if(user)   {
                if(user.password != req.body.password)  {
                    res.json({success : false, message : 'Wrong Password!'});
                }
                else{
                    // if user is found and password is right
                    // create a token
                    var token = jwt.sign(user, app.get('superSecret'), {
                        expiresIn : 144440
                    });

                    // return the information including token as JSON
                    res.json({
                        success : true,
                        message : 'Token Generated',
                        token : token
                    });
                }
            }
    });
})

// Route middleware to verify a token
apiRoutes.use(function(req, res, next)   {
    // Checking header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if(token)   {
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if(err) {
                return res.json({ success : false, message : 'Failed to authenticate token.'});
            }
            else{
                req.decoded = decoded;      //decoding the token and saving it to use in other routes
                next();
            }
        })
    }
    else    {
        return res.status(403).send({
            success : false,
            message : 'Token Not Generated!'
        });
    }
});


// route to show a random message (GET http://localhost:8080/api/) 
apiRoutes.get('/', function(req, res)   {
    res.json({message: 'Welcome the the API'});
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res)  {
    User.find({}, function(err, users)   {
        res.json(users)
    });
});

//Applying the routes to our application
app.use('/api', apiRoutes);





//***********************************************************************************************
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
//***********************************************************************************************
