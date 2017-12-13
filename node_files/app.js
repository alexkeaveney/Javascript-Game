//server.js

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const parser = require('body-parser');

let clientCount = 0;
let users = [];
let db;

app.use(express.static(__dirname + '/node_modules'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
//
app.get('/howto', function(req, res) {
  res.sendFile(__dirname + '/public/howto.html');
});
app.get('/lobby', function(req, res) {
  res.sendFile(__dirname + '/public/lobby.html');
});

const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://127.0.0.1:27017', (err, database) => {
  if (err) {
    console.log(err);
  }
  else {
    db = database;
    console.log(db);
    console.log("connected to db");
  }
  app.listen(8080, () => {
    console.log('listening on 8080');
  });

  //console.log(collection.find());
});

//});


app.use(parser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(parser.json());

app.post('/', (req, res) => {

  // db.collection('users').save(req.body, (err, result) => {
  // if (err) return console.log(err)
  //   console.log('saved to database')
  //   res.redirect('/')
  // });


  console.log(req.body.user.name);
  console.log(req.body.user.password);

  //check if the user is in the database

  //if they are check credentials
    //create cookie / sign them in

  //if not then sign them up / create cookie / sign them in


});




io.on('connection', function(socket) {
    //on a new connection increments the counts
//    clientCount++;
//    console.log("Client count: " + clientCount);
//    users.push(`user${clientCount}`);
    socket.emit("userList", users);

//
//    socket.emit("userList", users);
//    socket.emit("categories", rooms);
//    socket.join("General");
//
    socket.on('connectPlayer', function(username) {

        console.log("User connected: " + username);
        users.push(username);
        console.log(users);
        socket.broadcast.emit('addPlayer', username);

    });

});


server.listen(3000);
