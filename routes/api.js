var express = require('express');
//var session = require("express-session");
var mysql = require("mysql");
var router = express.Router();
var request = require("request");
var url = "http://api.textlocal.in/send/?username=anusha.n@outlook.com&hash=522a72147c55ff98ad791371bbfe2ea1107f05c4&sender=TXTLCL&numbers=919686711960&message=TEST MESSAGE";
var http = require('http');
var XLSX = require('xlsx');
var nodemailer = require("nodemailer");
var fs = require('fs');
var mv = require('mv');
var pool = mysql.createPool({
    connectionLimit: 100, //important
    host: 'toboonew.ccgoamilxspp.us-west-2.rds.amazonaws.com',
    user: 'toboo123',
    password: 'toboo123',
    database: 'toboo',
    debug: false
});
var generator = require('xoauth2').createXOAuth2Generator({
    user: 'toboogroupltd@gmail.com',
    clientId: '60985303895-pm55clrqn3h6ql5v3c9nmedn7ak5fb8u.apps.googleusercontent.com',
    clientSecret: 'yHQjXFIy11FEDEimlcT6_KYP',
    refreshToken: '1/mwfZ0PxUNN9Z2QcN2o2dh-SfsqHzx6VFq61IhiBkN0A',
    accessToken: 'ya29.Ci_KA3eQvfd255xBacuj-CDpPMK40tH5LDuOgCp1PJVNQFeY-SGzQlBuPBVURLpJrQ' // optional
});

// listen for token updates
// you probably want to store these to a db
generator.on('token', function (token) {
    console.log('New token for %s: %s', token.user, token.accessToken);
});

// login
var transporter = nodemailer.createTransport(({
    service: 'gmail',
    auth: {
        xoauth2: generator
    }
}));
//var transporter = nodemailer.createTransport({
//    service: 'Gmail',
//    auth: {
//        user: 'toboogroupltd@gmail.com', // Your email id
//        pass: '123456toboo' // Your password
//    }
//});
var otp;
var mobile;
function sendotp(req, res, next) {
    console.log("calling method");
    console.log("http://api.textlocal.in/send/?username=anusha.n@outlook.com&hash=522a72147c55ff98ad791371bbfe2ea1107f05c4&sender=TXTLCL&numbers=91" + mobile + "&message=" + otp);
    request({
        url: "http://api.textlocal.in/send/?username=anusha.n@outlook.com&hash=522a72147c55ff98ad791371bbfe2ea1107f05c4&sender=TXTLCL&numbers=" + mobile + "&message=" + otp, //URL to hit
        method: 'POST', //Specify the method
    }, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
        }
    });
}
;
function getRandomInt(req, res, next) {
    return Math.floor(100000 + Math.random() * 900000);
}
;
router.use('/', function (req, res, next) {
    var responseSettings = {
        "AccessControlAllowOrigin": "*",
        "AccessControlAllowHeaders": "Content-Type,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name",
        "AccessControlAllowMethods": "POST, GET, PUT, DELETE, OPTIONS",
        "AccessControlAllowCredentials": true
    };

    /**
     *      * Headers
     *           */
    res.header("Access-Control-Allow-Credentials", responseSettings.AccessControlAllowCredentials);
    res.header("Access-Control-Allow-Origin", responseSettings.AccessControlAllowOrigin);
    res.header("Access-Control-Allow-Headers", (req.headers['access-control-request-headers']) ? req.headers['access-control-request-headers'] : "x-requested-with");
    res.header("Access-Control-Allow-Methods", (req.headers['access-control-request-method']) ? req.headers['access-control-request-method'] : responseSettings.AccessControlAllowMethods);

    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    }
});

/* GET home page. */
router.post('/checkuser', function (req, res, next) {
    var uname = req.body.username;
    var pword = req.body.password;
    var userData;
    if (uname.indexOf('@') === -1) {
        console.log("mobile========================>")
        query = "select * from user where mobile='" + uname + "' and password='" + pword + "'";
        query2 = "select otp from user where mobile='" + uname + "'";
    } else {
        console.log("mail========================>");
        query = "select * from user where email='" + uname + "' and password='" + pword + "'";
        query2 = "select otp from user where email='" + uname + "'";
    }

    pool.getConnection(function (err, connection) {
        if (err) {
            //connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        } else {
            connection.query(query, function (err, rows) {
                connection.release();
                if (!err) {
                    if (rows.length > 0) {
                        // check whether user is active or not                       
                        if (rows[0].otpverified === 'N') {
                            mobile = rows[0].mobile;
                            console.log(rows[0].usertype);
                            userData = rows;
                            otp = getRandomInt();
                            query1 = "update user set otp='" + otp + "' where email='" + rows[0].email + "'";
                            console.log("generatedotp--" + otp);
                            //sendotp();
                            connection.query(query1, function (err, rows) {
                                if (!err) {
                                    connection.query(query2, function (err, rows) {
                                        if (!err) {
                                            // console.log("fetch--" + rows[0].otp);

                                            res.send({status: "SUCCESS", otp: rows, data: userData});
                                        } else {
                                            res.send({status: "FAIL", error: "Unable to get otp"});
                                        }
                                    });

                                } else {
                                    res.send({status: "FAIL", error: "Unable to update otp"});
                                }
                            });
                        } else if (rows[0].otpverified === 'Y') {
                            res.send({status: "SUCCESS", data: rows});
                        } else {
                            res.send({status: "FAIL", error: "Your account is suspended. Contact admin"});
                        }
                    } else
                        res.send({status: "FAIL", error: "Invalid credentials"});
                } else {
                    res.send({status: "FAIL", error: "Invalid credentials"});
                }
            });
        }
    });
});

router.post('/createuser', function (req, res, next) {
    var name = req.body.name;
    var email = req.body.email;
    var age = req.body.age;
    mobile = req.body.mobile;
    var password = req.body.password;
    var usertype = req.body.type;
    var image = req.body.image;
    q = "select * from user where email='" + email + "'";


    query2 = "select otp from user where email='" + email + "'";
    query3 = "select max(id) as id from user";

    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(q, function (err, rows) {
            if (!err) {
                if (rows.length > 0) {
                    res.send({status: "FAIL", error: "User already exists"});
                } else {
                    connection.query(query3, function (err, rows) {
                        if (!err) {
                            var pid = rows[0].id;
                            var file = pid + 1 + '_' + 'user' + '.jpg';
                            var bitmap = new Buffer(image, 'base64');
                            // write buffer to file
                            fs.writeFileSync(file, bitmap);
                            mv(file, 'public/images/' + file, function (err) {
                                //error handle
                            });
                            query = "insert into user (name, email, mobile,age,password, created, modified, usertype, otpverified,imageurl) values ('" +
                                    name + "','" + email + "','" + mobile + "'," + age + ",'" + password + "',now(),now()," + usertype + ",'N','" + file + "')";
                            console.log(query);
                            connection.query(query, function (err, rows) {
                                //connection.release();
                                if (!err) {
                                    otp = getRandomInt();
                                    console.log("OTP:" + otp);
                                    query1 = "update user set otp='" + otp + "' where email='" + email + "'";
                                    //sendotp();
                                    connection.query(query1, function (err, rows) {
                                        //connection.release();
                                        if (!err) {
                                            connection.query(query2, function (err, rows) {
                                                connection.release();
                                                if (!err) {
                                                    res.send({status: "SUCCESS", data: rows});
                                                } else {
                                                    res.send({status: "FAIL", error: "Unable to get otp"});
                                                }
                                            });
                                        } else {
                                            res.send({status: "FAIL", error: "Unable to update otp"});
                                        }
                                    });
                                } else {
                                    res.send({status: "FAIL", error: "Unable to add user"});
                                }
                            });
                        } else {
                            res.send({status: "FAIL", error: "Unable to add user"});
                        }
                    });
                }
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/verifyotp', function (req, res, next) {
    var otp = req.body.otp;
    var email = req.body.email;
    query = "select otp from user where email='" + email + "'";
    query1 = "update user set otpverified='Y' where email='" + email + "'";
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            connection.release();
            if (!err) {
                if (rows[0].otp === otp) {
                    connection.query(query1, function (err, rows) {
                        if (!err) {
                            res.send({status: "SUCCESS"});
                        } else {
                            res.send({status: "FAIL", error: "Unable to update user"});
                        }
                    });
                } else {
                    res.send({status: "FAIL", error: "Incorrect OTP"});
                }

            } else {
                res.send({status: "FAIL", error: "Unable to get Otp"});
            }
        });
    });

});
router.post('/forgotpassword', function (req, res, next) {
    //var uid = req.body.id;
    var email = req.body.email;
    console.log(email);
    //var password = req.body.password;
    query = "select password from user where email='" + email + "'";
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            connection.release();
            if (!err) {
                var password = rows[0].password;
                var mailOptions = {
                    from: 'toboogroupltd@gmail.com', // sender address
                    to: email, // list of receivers
                    subject: 'Star App Password', // Subject line
                    text: "Hi Sir/Madam,\nYour password to login in Star App : " + password //, // plaintext body
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                        res.send({status: "FAIL", error: 'Could Not Send Email'});
                    } else {
                        console.log('Message sent');
                        res.send({status: "SUCCESS"});
                    }
                });
            } else {
                res.send({status: "FAIL", error: "Unable to get pssword"});
            }
        });
    });
});
router.post('/postitem', function (req, res, next) {
    var pname = req.body.name;
    var description = req.body.description;
    var rent = req.body.forrent;
    var buy = req.body.forbuy;
    var take = req.body.fortakeaway;
    var pin = req.body.postalcodes;
    console.log(pin);
    var exchange = req.body.forexchange;
    console.log("ex====>" + exchange);
    var image = req.body.picture;
    var cid = req.body.categoryid;
    var condition = req.body.conditon;
    var userid = req.body.userid;
    var price = req.body.price;
    var category = req.body.subcategory;
    var age = req.body.age;
    var gender = req.body.gender;
    if (rent === 'Y') {
        console.log("rent");
        var query;
        query = "insert into product (name, description,availforbuy,availforrent,availfortake,availforexchange,categoryid,pcondition,createdon,charge,userid,subcategory,age,gender) values ('" + pname + "','"
                + description + "','" + buy + "','" + rent + "','" + take + "','" + exchange + "'," + cid + ",'" + condition + "',Now()," + price + ",'" + category + "'," + age + ",'" + gender + "')";

        console.log(query);
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
            }
            connection.query(query, function (err, result) {
                //connection.release();
                if (!err) {
                    var pid = result.insertId;
                    query3 = "insert into postal_table(productid,pin) values(" + pid + ",'" + pin + "')";
                    console.log(query3);
                    connection.query(query3, function (err, result) {
                        if (!err) {
                            var dateOb = new Date();
                            var date = dateOb.getDate();
                            var month = dateOb.getMonth() + 1;
                            var year = dateOb.getFullYear();
                            //alert("date==>" + date + "  month==>" + month + "  year==>" + year);
                            var formatdate = year + "-" + month + "-" + date;
                            var count = 1;
                            query4 = "insert into view_count(pid,viewdon,count) values(" + pid + ",'" + formatdate + "'," + count + ")";
                            connection.query(query4, function (err, result) {
                                if (!err) {
                                    var i = 0;
                                    image.forEach(function (item) {
                                        var file = pid + '_' + 'product' + i + '.jpg';
                                        var bitmap = new Buffer(item, 'base64');
                                        // write buffer to file
                                        fs.writeFileSync(file, bitmap);
                                        mv(file, 'public/images/' + file, function (err) {
                                            //error handle
                                        });
                                        query1 = "insert into image_table(productid,imageurl) values(" + pid + ",'" + file + "')";
                                        connection.query(query1, function (err, result) {
                                            if (!err) {
                                                console.log("inserted image");
                                            }
                                        });
                                        i++;
                                        if (i === image.length) {
                                            connection.release();
                                            res.send({status: "SUCCESS"});
                                        }
                                    });
                                }
                            });

                        }
                    });

                } else {
                    connection.release();
                    res.send({status: "FAIL", error: "Unable to insert data"});
                }
            });
        });
    } else {
        console.log("not rent");
        var query;
        query = "insert into product (name, description,availforbuy,availforrent,availfortake,availforexchange,categoryid,pcondition,createdon,charge,userid,subcategory,age,gender) values ('" + pname + "','"
                + description + "','" + buy + "','" + rent + "','" + take + "','" + exchange + "'," + cid + ",'" + condition + "',Now()," + price + "," + userid + ",'" + category + "'," + age + ",'" + gender + "')";

        console.log(query);
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
            }
            connection.query(query, function (err, result) {
                //connection.release();
                if (!err) {
                    var pid = result.insertId;
                    var dateOb = new Date();
                    var date = dateOb.getDate();
                    var month = dateOb.getMonth() + 1;
                    var year = dateOb.getFullYear();
                    //alert("date==>" + date + "  month==>" + month + "  year==>" + year);
                    var formatdate = year + "-" + month + "-" + date;
                    var count = 1;
                    query4 = "insert into view_count(pid,viewdon,count) values(" + pid + ",'" + formatdate + "'," + count + ")";
                    connection.query(query4, function (err, result) {
                        if (!err) {
                            var i = 0;
                            image.forEach(function (item) {
                                var file = pid + '_' + 'product' + i + '.jpg';
                                var bitmap = new Buffer(item, 'base64');
                                // write buffer to file
                                fs.writeFileSync(file, bitmap);
                                mv(file, 'public/images/' + file, function (err) {
                                    //error handle
                                });
                                query1 = "insert into image_table(productid,imageurl) values(" + pid + ",'" + file + "')";
                                connection.query(query1, function (err, result) {
                                    if (!err) {
                                        console.log("inserted image");
                                    }
                                });
                                i++;
                                if (i === image.length) {
                                    connection.release();
                                    res.send({status: "SUCCESS"});
                                }
                            });
                        }
                    });

                } else {
                    connection.release();
                    res.send({status: "FAIL", error: "Unable to insert data"});
                }
            });
        });
    }

});

router.post('/updatepoints', function (req, res, next) {
    var point = req.body.point;
    var userid = req.body.id;
    query = "update user set point=" + point + " where id=" + userid;
    query1 = "select point from user where id=" + userid;
    console.log(query);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            if (!err) {
                connection.query(query1, function (err, rows) {
                    connection.release();
                    if (!err) {
                        var points = rows[0].point;
                        res.send({status: "SUCCESS", data: points});
                    } else {
                        res.send({status: "FAIL", error: "Unable to get data"});
                    }
                });
                //res.send({status: "SUCCESS"});
            } else {
                res.send({status: "FAIL", error: "Unable to update data"});
            }
        });
    });
});
router.post('/getcategories', function (req, res, next) {
    query = "select * from product_category";
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            connection.release();
            if (!err) {
                res.send({status: "SUCCESS", data: rows});
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.get('/getposts/:userid', function (req, res, next) {
    var userid = req.params.userid;
    query = "select * from product where userid=" + userid;
    console.log(userid);
    var posts = {};
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            posts = rows;
            //console.log(posts);
            if (!err) {
                if (posts.length === 0) {
                    res.send({status: "SUCCESS", data: posts});
                } else {
                    posts.forEach(function (item, index) {
                        console.log("itemid===>" + item.id);
                        query1 = "select imageurl from image_table where productid=" + item.id;
                        //console.log("select image from image_table where productid=" + item.id)

                        connection.query(query1, function (err, rows) {
                            if (!err) {
                                var image = rows;
                                item.images = image;
                                var query2 = "select COUNT(offerid)  AS count from offers where pid=" + item.id;
                                connection.query(query2, function (err, rows) {
                                    //console.log(posts);
                                    var offercount = rows[0].count;
                                    console.log(offercount);
                                    item.offercount = offercount;
                                    if (index === posts.length - 1) {
                                        console.log(posts);
                                        res.send({status: "SUCCESS", data: posts});
                                    }
                                });
                            }
                        });
                    });
                }
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.get('/getoffers/:id', function (req, res, next) {
    var id = req.params.id;
    query = "select * from offers where pid=" + id;
    console.log(id);
    var offerslist = {};
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            offerslist = rows;
            //console.log(posts);
            if (!err) {
                offerslist.forEach(function (item, index) {
                    console.log("itemid===>" + item.userid);
                    query1 = "select name,email,mobile from user where id=" + item.userid;
                    //console.log("select image from image_table where productid=" + item.id)

                    connection.query(query1, function (err, rows) {
                        if (!err) {
                            var name = rows[0].name;
                            var email = rows[0].email;
                            var mobie = rows[0].mobile;
                            item.username = name;
                            item.mobile = mobie;
                            item.email = email;
                            if (index === offerslist.length - 1) {
                                console.log(offerslist);
                                res.send({status: "SUCCESS", data: offerslist});
                            }
                        }
                    });
                });
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/getproductdetail', function (req, res, next) {
    var productid = req.body.id;
    query = "select * from image_table where productid=" + productid;
    query1 = "select COUNT(offerid)  AS count from offers where pid=" + productid;
    query2 = "SELECT id,name FROM USER WHERE id=(SELECT userid FROM product WHERE id=" + productid + ")";
    console.log(query);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            //console.log(posts);
            var images = rows;
            if (!err) {
                connection.query(query1, function (err, rows) {
                    //console.log(posts);
                    var offercount = rows[0].count;
                    console.log(offercount);
                    if (!err) {
                        connection.query(query2, function (err, rows) {
                            if (!err) {
                                res.send({status: "SUCCESS", image: images, offers: offercount, userdata: rows});
                            } else {
                                res.send({status: "FAIL", error: "Unable to get user"});
                            }
                        });
                        //console.log("select image from image_table where productid=" + item.id)                                                

                    } else {
                        res.send({status: "FAIL", error: "Unable to get count"});
                    }
                });
                //console.log("select image from image_table where productid=" + item.id)                                                
                //res.send({status: "SUCCESS", image: rows});
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/makeoffer', function (req, res, next) {
    var productid = req.body.pid;
    var userid = req.body.userid;
    var offer = req.body.price;
    query = "insert into offers(pid, userid, offer) values(" + productid + "," + userid + "," + offer + ")";
    query1 = "select COUNT(offerid)  AS count from offers where pid=" + productid;
    console.log(query + "offer :" + offer);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            //console.log(posts);
            if (!err) {
                connection.query(query1, function (err, rows) {
                    if (!err) {
                        var offercount = rows[0].count;
                        console.log(offercount);
                        res.send({status: "SUCCESS", data: offercount});
                    }
                });
                //console.log("select image from image_table where productid=" + item.id)                                                

            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/createorder', function (req, res, next) {
    var userid = req.body.userid;
    var address1 = req.body.address1;
    var address2 = req.body.address2;
    var address3 = req.body.address3;
    var zipcode = req.body.zipcode;
    var cart = req.body.cart;
    query = "insert into address (userid, address1, address2, state, zipcode) values (" + userid + ",'" + address1 + "','" + address2 + "','" + address3 + "','" + zipcode + "')";
    //query1 = "SELECT id FROM address WHERE userid=" + userid + " ORDER BY id DESC LIMIT 1";
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            //console.log(posts);
            if (!err) {
                var addressid = rows.insertId;
                var pmode = "ONLINE"
                var q1 = "insert into order_detail (date, paymentmode,addressid,userid) values (now(),'" + pmode
                        + "','" + addressid + "'," + userid + ")";
                connection.query(q1, function (err, rows) {
                    if (!err) {
                        var orderid = rows.insertId;
                        var q3 = "insert into order_item (orderid, productid,prize) values ";
                        for (item in cart) {
                            var cartitem = cart[item];
                            q3 = q3 + "(" + orderid + "," + cartitem['id'] + "," + cartitem['charge'] + "),";
                        }
                        q3 = q3.slice(0, -1);
                        connection.query(q3, function (err, result) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                    res.send({status: "FAIL", error: "Item update failed"});
                                });
                            }
                            connection.commit(function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        connection.release();
                                        res.send({status: "FAIL", error: "Commit failed"});
                                    });
                                }
                                connection.release();
                                res.send({status: "SUCCESS"});
                            })
                        })

                    } else {
                        res.send({status: "FAIL", error: "Unable to insert order"});
                    }
                });
            } else {
                res.send({status: "FAIL", error: "Unable to insert address"});
            }
        });
    });
});
router.post('/getpincodes', function (req, res, next) {
    var productid = req.body.pid;
    query = "select pin from postal_table where productid=" + productid;
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            //console.log(posts);
            if (!err) {
                var a = rows[0].pin;
                //console.log("select image from image_table where productid=" + item.id)
                a = a.replace(/'/g, '"');
                a = JSON.parse(a);
                console.log(a);
                res.send({status: "SUCCESS", data: a});
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.get('/getdashboardcounts/:userid', function (req, res, next) {
    var userid = req.params.userid;
    query = "select COUNT(*) AS postcount from product where userid=" + userid;
    console.log(userid);
    var postcount;
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            postcount = rows[0].postcount;
            if (!err) {
                res.send({status: "SUCCESS", postcount: postcount});
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});

router.post('/getproducts', function (req, res, next) {

    var switchid = req.body.role;
    var categoryid = req.body.id;
    var query
    if (switchid == 1) {
        console.log("idb===>" + switchid);
        query = "select * from product where availforbuy='Y' and categoryid=" + categoryid;
    }
    if (switchid == 2) {
        query = "select * from product where availforrent='Y' and categoryid=" + categoryid;
        console.log("idr===>" + switchid);

    }
    if (switchid == 3) {
        query = "select * from product where availfortake='Y' and categoryid=" + categoryid;
        console.log("idt===>" + switchid);
    }
    if (switchid == 4) {
        query = "select * from product where availforexchange='Y' and categoryid=" + categoryid;
        console.log("idt===>" + switchid);
    }
    var products = {};
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            products = rows;

            console.log("pro==>" + products);
            if (!err) {
                console.log("pro==>" + products.length);
                if (products.length == 0) {
                    res.send({status: "FAIL", error: "No item Under this Category"});
                } else {
                    console.log("pro==>");
                    products.forEach(function (item, index) {
                        console.log("itemid===>" + item.id);
                        query2 = "SELECT SUM(COUNT) AS view_count FROM view_count WHERE pid=" + item.id;
                        //console.log("select image from image_table where productid=" + item.id)
                        connection.query(query2, function (err, rows) {
                            if (!err) {
                                var viewcount = rows[0].view_count;
                                item.viewcount = viewcount;
                                query1 = "select imageurl from image_table where productid=" + item.id;
                                connection.query(query1, function (err, rows) {
                                    if (!err) {
                                        var image = rows;
                                        //console.log(image);
                                        item.images = image;
                                        if (index === products.length - 1) {
                                            console.log("itemid===> send");
                                            res.send({status: "SUCCESS", data: products});
                                        }
                                    } else {
                                        res.send({status: "FAIL", error: "unable to get data"});
                                    }
                                });
                            } else {
                                res.send({status: "FAIL", error: "unable to get data"});
                            }
                        });
                    });
                }
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/getallproducts', function (req, res, next) {
    var allproducts = {};
    var query = "select * from product";
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            allproducts = rows;
            //console.log("pro==>" + JSON.stringify(allproducts));
            if (!err) {
                //console.log("pro==>" + allproducts.length);
                if (allproducts.length == 0) {
                    res.send({status: "SUCCESS", data: ""});
                } else {
                    console.log("pro==>");
                    allproducts.forEach(function (item, index) {
                        console.log("itemid===>" + item.id);
                        var query2 = "SELECT SUM(COUNT) AS view_count FROM view_count WHERE pid=" + item.id;
                        //console.log("select image from image_table where productid=" + item.id)
                        connection.query(query2, function (err, rows) {
                            if (!err) {
                                var viewcount = rows[0].view_count;
                                item.viewcount = viewcount;
                                var query1 = "select imageurl from image_table where productid=" + item.id;
                                connection.query(query1, function (err, rows) {
                                    if (!err) {
                                        var image = rows;
                                        //console.log(image);
                                        item.images = image;
                                        if (index === allproducts.length - 1) {
                                            console.log("itemid===> send");
                                            res.send({status: "SUCCESS", data: allproducts});
                                        }
                                    } else {
                                        res.send({status: "FAIL", error: "unable to get data"});
                                    }
                                });
                            } else {
                                res.send({status: "FAIL", error: "unable to get data"});
                            }
                        });
                    });
                }
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});

//    var workbook = XLSX.readFile('Toys.xlsx');
//    var sheet_name_list = workbook.SheetNames;
//    var data = [];
//    if (sheet_name_list.length > 0)
//    {
//        sheet_name_list.forEach(function (y) {
//            var worksheet = workbook.Sheets[y];
//            var headers = {};
//            for (z in worksheet) {
//                if (z[0] === '!')
//                    continue;
//                //parse out the column, row, and value
//                var tt = 0;
//                for (var i = 0; i < z.length; i++) {
//                    if (!isNaN(z[i])) {
//                        tt = i;
//                        break;
//                    }
//                }
//                ;
//                var col = z.substring(0, tt);
//                var row = parseInt(z.substring(tt));
//                var value = worksheet[z].v;
//
//                //store header names
//                if (row == 1 && value) {
//                    headers[col] = value;
//                    continue;
//                }
//
//                if (!data[row])
//                    data[row] = {};
//                data[row][headers[col]] = value;
//            }
//            //drop those first two rows which are empty
//            data.shift();
//            data.shift();
//            console.log(data);
//        });
//        res.send({status: "SUCCESS", data: data});
//    } else {
//        res.send({status: "ERROR", error: "Unable to fetch data"});
//    }
router.get('/deliverysummary/:did/:ddate', function (req, res, next) {
    var did = req.params.did;
    var ddate = req.params.ddate;
    query = "SELECT DISTINCT(od.id)AS id, os.status,od.paymentmode,SUM(oi.price) AS total FROM order_details AS od, order_status AS os ,order_items AS oi " +
            " WHERE od.deliveryboyid=" + did +
            " AND od.deliverydate='" + ddate + "' " + " AND os.orderid=od.id AND od.id=oi.orderid AND os.status <> 'New' AND os.status <> 'Out For Delivery' AND os.status= (SELECT STATUS FROM order_status WHERE orderid=od.id ORDER BY DATE DESC LIMIT 1) GROUP BY id";
    console.log(query);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            connection.release();
            if (!err) {
                console.log(rows);
                res.send({status: "SUCCESS", data: rows});
            } else {
                res.send({status: "FAIL", error: "Unable to update user"});
            }
        });
    });
});
router.get('/ordersbydate/:did/:ddate', function (req, res, next) {
    var did = req.params.did;
    var ddate = req.params.ddate;
    query = "select distinct(od.id), os.status, u.name, u.mobile, a.address1, a.address2, a.city, a.zipcode from order_details as od, order_status as os" +
            ", address as a, user as u where od.userid=u.id and od.addressid=a.id and od.deliveryboyid=" + did +
            " and od.deliverydate='" + ddate + "' and os.orderid=od.id and os.status <> 'Cancelled' and os.status= (select status from order_status where orderid=od.id order by date DESC limit 1)";
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            connection.release();
            if (!err) {
                res.send({status: "SUCCESS", data: rows});
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/updateviewcount', function (req, res, next) {
    var pid = req.body.id;
    var Cdate = req.body.date;
    console.log("date===>" + Cdate);
    var query = "select * from view_count where viewdon='" + Cdate + "' and pid=" + pid;

    console.log(query);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            if (!err) {
                var count = 1;
                if (rows.length == 0) {
                    console.log(rows.length);
                    query1 = "insert into view_count(pid,viewdon,count) values(" + pid + ",'" + Cdate + "'," + count + ")";
                    connection.query(query1, function (err, rows) {

                        if (!err) {
                            res.send({status: "SUCCESS"});
                        } else {
                            res.send({status: "FAIL", error: "unable to insert"});
                        }
                    });
                } else {
                    console.log("update");
                    count = rows[0].count;
                    count = count + 1;
                    query2 = "update view_count set count=" + count + " where pid=" + pid + " and viewdon='" + Cdate + "'";
                    console.log(query2);
                    connection.query(query2, function (err, rows) {
                        connection.release();
                        if (!err) {
                            res.send({status: "SUCCESS"});
                        } else {
                            res.send({status: "FAIL", error: "Unable to update"});
                        }
                    });
                }

            } else {
                res.send({status: "FAIL", error: "Unable to get"});
            }
        });
    });
});
router.post('/gethotproducts', function (req, res, next) {
    var Cdate = req.body.Cdate;
    var Pdate = req.body.prevdate;
    query = "SELECT pid as id,SUM(COUNT) AS COUNT FROM view_count WHERE viewdon BETWEEN '" + Pdate + "' AND '" + Cdate + "' GROUP BY pid ORDER BY COUNT DESC LIMIT 3";
    console.log(query);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            connection.release();
            if (!err) {
                var hotproduct = rows;
                hotproduct.forEach(function (item, index) {
                    query1 = "select name,categoryid from product where id=" + item.id;
                    //console.log("select image from image_table where productid=" + item.id)
                    console.log(query1);
                    connection.query(query1, function (err, rows) {
                        if (!err) {
                            //console.log(image);
                            if (rows.length !== 0) {
                                item.name = rows[0].name;
                                item.categoryid = rows[0].categoryid;
                                query2 = "select imageurl from image_table where productid=" + item.id;
                                connection.query(query2, function (err, rows) {
                                    if (!err) {
                                        var image = rows;
                                        //console.log(image);
                                        item.images = image;
                                        if (index === hotproduct.length - 1) {
                                            console.log("itemid===> send");
                                            res.send({status: "SUCCESS", data: hotproduct});
                                        }
                                    } else {
                                         res.send({status: "SUCCESS", data: ""});
                                    }
                                });
                            }else{
                                
                            }


                        } else {
                            res.send({status: "FAIL", error: "Unable to get data"});
                        }
                    });
                });
                //res.send({status: "SUCCESS",data:rows});
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/gethotproductdetail', function (req, res, next) {
    var productid = req.body.id;
    var query = "select * from product where id=" + productid;
    console.log("p=>" + productid + "qu=>" + query);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            //console.log(posts);
            if (!err) {
                res.send({status: "SUCCESS", data: rows});
                //console.log("select image from image_table where productid=" + item.id)                                                
                //res.send({status: "SUCCESS", image: rows});
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/getuseremail', function (req, res, next) {
    var userid = req.body.userid;
    var query = "select email from user where id=" + userid;
    console.log("p=>" + userid + "qu=>" + query);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            //console.log(posts);
            if (!err) {
                var email = rows[0].email;
                console.log(email);
                res.send({status: "SUCCESS", data: email});
                //console.log("select image from image_table where productid=" + item.id)                                                
                //res.send({status: "SUCCESS", image: rows});
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/placegiftrequest', function (req, res, next) {
    var userid = req.body.userid;
    var pid = req.body.pid;
    var ownerid = req.body.ownerid;
    var pname = req.body.pname;
    var query = "insert into gift_details (pid, userid, status) values (" + pid + "," + userid + ",0)";
    var query1 = "select name,email,mobile from user where id=" + userid;
    var query2 = "select email from user where id=" + ownerid;
    console.log("p=>" + userid + "qu=>" + query);
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, result) {
            //console.log(posts);
            if (!err) {
                var gid = result.insertId;
                connection.query(query1, function (err, rows) {
                    if (!err) {
                        var email = rows[0].email;
                        var name = rows[0].name;
                        var mobile = rows[0].mobile;
                        connection.query(query2, function (err, rows) {
                            if (!err) {
                                var tomail = rows[0].email;
                                var gurl = "http://192.168.1.143:3000/updaterequeststatus/" + gid;
                                var body = "<html><body><h4>Take Away Request</h4><p>Name :" + name + "</p><p>Mobile :" + mobile + "</p><p>Email : " + email + "</p><p>wish to take away the following product : " + pname + "</p><br><a href=" + gurl + ">Accept</a></body></html>"
                                var mailOptions = {
                                    from: 'toboogroupltd@gmail.com', // sender address
                                    to: tomail, // list of receivers
                                    subject: 'Gift Request', // Subject line
                                    html: body //, // plaintext body
                                };
                                transporter.sendMail(mailOptions, function (error, info) {
                                    if (error) {
                                        console.log(error);
                                        res.send({status: "FAIL", error: 'Could Not Send Email'});
                                    } else {
                                        console.log('Message sent');
                                        res.send({status: "SUCCESS"});
                                    }
                                });
                            } else {
                                res.send({status: "FAIL", error: "Unable to get data"});
                            }
                        });
                    } else {
                        res.send({status: "FAIL", error: "Unable to get data"});
                    }
                });
            } else {
                res.send({status: "FAIL", error: "Unable to insert data"});
            }
        });
    });
});
router.get('/orderdetailsbyid/:oid', function (req, res, next) {
    var oid = req.params.oid;
    query1 = "select od.id, od.paymentmode, od.deliveryslot, u.name, a.address1, a.address2, a.city, a.zipcode from order_details as od, user as u, address as a where u.id = od.userid and a.id = od.addressid and od.id=" + oid;
    query = "select p.name, oi.quantity, oi.unit, oi.price from product as p, order_items as oi where oi.orderid=" + oid + " and p.id = oi.productid;";
    odetails = "";
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query1, function (err, rows) {
            if (!err) {
                odetails = rows;
                connection.query(query, function (err, rows) {
                    connection.release();
                    if (!err) {
                        res.send({status: "SUCCESS", odata: odetails, data: rows});
                    } else {
                        res.send({status: "FAIL", error: "Unable to get data"});
                    }
                })
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});
router.post('/deliveryupdate', function (req, res, next) {
    var oid = req.body.oid;
    var uid = req.body.uid;
    var pmode = req.body.pmode;
    var amount = req.body.amount;
    var date = req.body.date;
    var time = req.body.time;
    var notes = req.body.notes;
    var to = req.body.to;
    var name = req.body.name;
    var phone = req.body.phone;
    var sign = req.body.sign;
    query = "insert into delivery_details(orderid, userid, paymentmode, amount, date, time, notes, deliveredto, name, phone,signature) " +
            "values(" + oid + "," + uid + ", '" + pmode + "'," + amount + ",'" + date + "','" + time + "','" + notes + "','" + to + "','" + name +
            "','" + phone + "','" + sign + "')";
    query1 = "insert into order_status(orderid, date, status) values(" + oid + ", now(), 'Delivered')";
    //query1 = "select signature from delivery_details where orderid="+oid;
    pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            res.send({status: "FAIL", error: "Connection failure"});
        }
        connection.query(query, function (err, rows) {
            if (!err) {
                connection.query(query1, function (err, rows) {
                    connection.release();
                    if (!err) {
                        res.send({status: "SUCCESS"});
                    } else {
                        res.send({status: "FAIL", error: "Unable to get data"});
                    }
                });
            } else {
                res.send({status: "FAIL", error: "Unable to get data"});
            }
        });
    });
});

var random;
//function sendOTP(req, res, next) {
//    var newUrl = url + random;
//    http("http://www.google.com", function (error, res, body) {
//        if (res.statusCode === 200) {
//
//        }
//    });
//}
//;


module.exports = router;
