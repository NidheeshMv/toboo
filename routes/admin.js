var express = require('express');
var session = require("express-session");
var mysql = require("mysql");
//var multer = require('multer');
var router = express.Router();

var sessionOptions = {
    secret: "1q2w3e4r5t6y7ui9o0p",
    resave: true,
    saveUninitialized: false
};
var pool = mysql.createPool({
    connectionLimit: 100, //important
    host: 'toboonew.ccgoamilxspp.us-west-2.rds.amazonaws.com',
    user: 'toboo123',
    password: 'toboo123',
    database: 'toboo',
    debug: false
});
router.use(session(sessionOptions))
/* GET home page. */

/* GET home page. */
router.get('/', function (req, res, next) {
    console.log("userid======>" + req.session.userid);
    if (req.session) {
        console.log("userid======>" + req.session.email);
        if (req.session.email) {
            res.render('index', {title: 'Toboo Admin - Dashboard', "name": req.session.name, "utype": req.session.usertype});
        } else {
            res.render('login', {title: 'Toboo Admin - Login', error: req.session.error});
        }
    } else {
        res.render('login', {title: 'Toboo Admin - Login', error: req.session.error});
    }
});


/* validate user login. Take to dashboard if success else back to login page. */
router.post('/login', function (req, res, next) {
    uname = req.body.email;
    pword = req.body.password;
    query = "select * from user where email='" + uname + "' and password='" + pword + "'";
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            req.session.error = "Unable to connect";
            console.log("in");
            res.redirect("/");
        }
        connection.query(query, function (err, rows) {
            connection.release();
            if (!err) {
                if (rows.length > 0) {
                    req.session.email = req.body.email;
                    req.session.userid = rows[0]['id'];
                    req.session.name = rows[0]['name'];
                    req.session.usertype = rows[0]['usertype'];
                    console.log("userid======>" + req.session.userid);
                    if (req.session.error) {
                        delete req.session.error;
                    }

                    res.redirect('/');

                } else {
                    req.session.error = "Username or Password is incorrect";
                    res.redirect("/");
                    console.log("invalid");
                }
            } else {
                req.session.error = "Username or Password is incorrect";
                res.redirect("/");


            }
        });
    });
});
router.get('/updaterequeststatus/:gid', function (req, res, next) {
    var gid = req.params.gid;
    console.log(gid);
    var x = Number(gid);
    query = "update gift_details set status=1 where gid=" + x ;
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
        }
        connection.query(query, function (err, rows) {
            if (!err) {
                res.render('updaterequeststatus');
            } else {
                connection.release();
                res.render('errorpage', {title: 'Error'});
            }
        });
    });
});

module.exports = router;


