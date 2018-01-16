
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const parser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

let clientCount = 0;
let users = [];
let db;

app.use(express.static(__dirname + '/node_modules'));
app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: true,cookie: { path: '/', httpOnly: true, maxAge: 30 * 30000 },rolling: true}));
//parses the url
app.use(parser.urlencoded({ extended: true}));
// Parses the text as JSON and exposes the resulting object on req.body.
app.use(parser.json());

app.get('/', function(req, res) {

    if (req.session.user) {
        res.sendFile(__dirname + '/public/lobby.html');
    }
    else {
        res.sendFile(__dirname + '/public/index.html');
    }

});

app.get('/howto', function(req, res) {
    res.sendFile(__dirname + '/public/howto.html');
});

app.get('/lobby', function(req, res) {
    console.log(req.session.user);
    res.sendFile(__dirname + '/public/lobby.html');
});

const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://127.0.0.1:27017', (err, database) => {

    if (err) { console.log(err); }
    else { db = database.db('cheat'); }

    app.listen(8080, () => {
        console.log('Database connected');
    });
});




app.post('/', (req, res) => {

    const user = req.body.user.name;
    const pass = req.body.user.password;

    //check if the user is in the database
    db.collection('users').findOne({name: user}, function (findErr, result) {
        //if the user exists
        if (result !== null) {
            //if their password is correct
            if (pass === result.password) {
                //creates session for user
                req.session.user = user;
                req.session.save();
                //sends the lobby file
                res.sendFile(__dirname + '/public/lobby.html');
            }
            else {
                //res.send("Login details incorrect");
            }
        }
        //create a new user
        else {
            db.collection('users').insertOne({name: user, password: pass}, function(err, result) {
                console.log(result);
                //creates session for new user
                req.session.user = user;
                req.session.save();
                //sends the lobby file
                res.sendFile(__dirname + '/public/lobby.html');
            });
        }
    });

}); //end of post request




io.on('connection', function(socket) {


    socket.emit("userList", users);
    
    socket.on('connectPlayer', function(username) {
        console.log("session id" + socket.id);
        console.log("User connected: " + username);
        users.push(username);
        console.log(users);
        socket.broadcast.emit('addPlayer', username);

    });

});


server.listen(3000);
