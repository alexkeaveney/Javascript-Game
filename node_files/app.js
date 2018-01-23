'use strict';

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const parser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
var path = require('path');
var os = require('os');
var nodeStatic = require('node-static');

//classes
const Card = require('./classes/Card.js');
const Deck = require('./classes/Deck.js');
const Game = require('./classes/Game.js');
const Player =  require('./classes/Player.js');

let clientCount = 0;
let users = [];
let db;
let rooms = [];
let games = [];

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/classes'));
app.use(express.static(__dirname + '/public/images'));
// var filePath = path.join(__dirname, '../js/lib/adapter.js');

app.use(express.static('js/lib'));
app.use(express.static('public'));


//app.use(express.static(path.resolve('./public')));
app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: true,cookie: { path: '/', httpOnly: true, maxAge: 30 * 30000 },rolling: true}));
//parses the url
app.use(parser.urlencoded({ extended: true}));
// Parses the text as JSON and exposes the resulting object on req.body.
app.use(parser.json());

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/game.html');
});

const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://127.0.0.1:27017', (err, database) => {

    if (err) { console.log(err); }
    else { db = database.db('cheat'); }

    app.listen(8080, () => {
        console.log('Database connected');
    });
});






io.on('connection', function(socket) {

    socket.emit("userList", users);

    socket.on('connectPlayer', function(username) {
        console.log("session id" + socket.id);
        console.log("User connected: " + username);
        socket.nickname = username;
        const user = {user: username, socket: socket.id};
        users.push(user);
    });

    //similar method for disconnect player

    socket.on('startGame', function(user) {
        //socket.leave(socket.room);

        console.log("🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵🐵");
        console.log("NEW GAME");
        console.log("🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋🦋");

        if (rooms.length == 0) {
            // const num = rooms.length+1;
            // let new_room = "room" + num;
            let new_room = socket.nickname + "room";
            rooms.push(new_room);
            socket.join(new_room);
            socket.join(new_room, function () {
                //console.log(socket.id + " now in rooms ", socket.rooms);
                io.sockets.to(new_room).emit('room', 'new room created');
            });
        }
        else if (io.sockets.adapter.rooms[rooms[rooms.length-1]].length < 2) {
            socket.room = rooms[rooms.length-1];
            socket.join(rooms[rooms.length-1], function () {
                //console.log(socket.id + " now in rooms ", socket.rooms);
                io.sockets.to(rooms[rooms.length-1]).emit('room', 'game starting');
                let game = setup(rooms[rooms.length-1]);
                let players = game.players;

                let hand1 = [];
                let hand2 = [];

                for (let i =0; i < players[0].getHand().length; i++) {
                    //hand1.push(`${players[0].getHand()[i].rank}_of_${players[0].getHand()[i].suit}`);
                    hand1.push(players[0].getHand()[i]);
                }
                for (let i =0; i < players[1].getHand().length; i++) {
                    //hand2.push(`${players[1].getHand()[i].rank}_of_${players[1].getHand()[i].suit}`);
                    hand2.push(players[1].getHand()[i]);
                }

                io.sockets.sockets[players[0].getSocket()].emit('cards', {hand: hand1, move: true, turnCard: game.cardsOrder[game.turn]});
                io.sockets.sockets[players[1].getSocket()].emit('cards', {hand: hand2, move: false, turnCard: game.cardsOrder[game.turn]});

            });
        }
        else {
            // let num = rooms.length+1;
            // let new_room = "room" + num;
            let new_room = socket.nickname + "room";
            rooms.push(new_room);
            socket.room = new_room;
            socket.join(new_room, function () {
                //console.log(socket.id + " now in rooms ", socket.rooms);
                io.sockets.to(new_room).emit('room', 'new room created');
            });
        }



    });

    socket.on('playerMove', function(claimCards) {
        console.log(claimCards);
        console.log(socket.nickname + " played a move ");
        for (let i = 0; i < games.length; i++) {
            console.log("****WHOS TURN******");
            console.log(socket.id);
            console.log(games[i].whoseTurn);
            console.log("****WHOS TURN******");
            if (socket.id == games[i].whoseTurn) {
                // console.log("")
                games[i].makeTurn(claimCards, socket);
                let opponent;
                console.log("👀👀👀👀👀👀👀👀👀👀👀👀👀👀👀👀");
                console.log("socket id is equal to whoseturn");
                console.log("👀👀👀👀👀👀👀👀👀👀👀👀👀👀👀👀");

                for (let x = 0; x < games[i].players.length; x++) {
                    if (games[i].players[x].getSocket() != socket.id) {
                        console.log("Sending to both");
                        console.log(games[i].players[x].getSocket());
                        //console.log(socket.id);
                        console.log("🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘🐘");

                        io.sockets.sockets[games[i].players[x].getSocket()].emit('opponentmove', claimCards);
                    }
                }
            }
        }

    });

    socket.on('bullshit', function(callBullshit) {
        console.log("Bullshit called" + callBullshit);
        console.log("*********games*************");
        console.log(games);
        console.log("*********games*************");
        console.log("*********games len*************");
        console.log(games.length);
        console.log("*********games len*************");


        if (callBullshit) {
            //check that its bullshit
            let caller;
            let player;
            for (let i = 0; i < games.length; i++) {
                console.log("in first for loop");
                for (let x = 0; x < games[i].players.length; x++) {
                    console.log("in second for loop");

                    if (socket.id == games[i].players[x].socket) {
                        caller = games[i].players[x];
                        console.log("caller" + caller.username);
                    }
                    else {
                        player = games[i].players[x];
                        console.log("player" + player.username);
                    }

                }
                let result = games[i].callCheat(caller, player);

                console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&");
                console.log("Player hand = " + player.getHand().length);
                console.log("Caller hand = " + caller.getHand().length);
                console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&");

                if (result) {
                    io.sockets.sockets[caller.getSocket()].emit('handresult', {
                        result: "You caught " + player.username + " bullshitting. They take the pile",
                        yourTurn: true,
                        turnCard: games[i].cardsOrder[games[i].turn],
                        cards: caller.getHand()
                    });
                    io.sockets.sockets[player.getSocket()].emit('handresult', {
                        result: caller.username + " caught you bullshitting. You take the pile",
                        yourTurn: false,
                        turnCard: games[i].cardsOrder[games[i].turn],
                        cards: player.getHand()
                    });
                }
                else {
                    io.sockets.sockets[caller.getSocket()].emit('handresult', {
                        result: player.username + " wasnt bullshitting. You take the pile",
                        yourTurn: true,
                        turnCard: games[i].cardsOrder[games[i].turn],
                        cards: caller.getHand()
                    });
                    io.sockets.sockets[player.getSocket()].emit('handresult', {
                        result: caller.username + " called bullshit when you told the truth. They take the pile",
                        yourTurn: false,
                        turnCard: games[i].cardsOrder[games[i].turn],
                        cards: player.getHand()
                    });
                }
            }
        }
        else {
            //move on to the next turn
            console.log("No bullshit call");

        }
    });

    socket.on('message', function(message) {

  // for a real app, would be room-only (not broadcast)
        console.log(message);
        if (message=="bye") {
            socket.broadcast.emit('message', message);
        }
        else {
            if (games !== undefined && games.length > 0) {
                console.log("🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽");
                console.log(games.length);
                                console.log("🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽");
                for (let i = 0; i < games.length; i++) {
                    console.log(games[0].players.length);
                     for (let x = 0; x < games[i].players.length; x++) {
                         console.log("🦐🦐🦐🦐🦐🦐🦐🦐🦐🦐🦐🦐🦐🦐🦐");
                         if (games[i].players[x].getSocket() == socket.id) {
                             io.sockets.sockets[games[i].players[0].getSocket()].emit('message', message);
                             io.sockets.sockets[games[i].players[1].getSocket()].emit('message', message);
                         }
                     }
                }
            }
        }


    });

    socket.on('ipaddr', function() {
      var ifaces = os.networkInterfaces();
      for (var dev in ifaces) {
        ifaces[dev].forEach(function(details) {
          if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
            socket.emit('ipaddr', details.address);
          }
        });
      }
    });


    function setup(room) {

        //find out whos in the room
        console.log(io.sockets.adapter.rooms[room]);
        let clients = io.sockets.adapter.rooms[room].sockets;
        let sockets = [];
        let gameUsers = [];

        //console.log(room)

        let p1 = room.substring(0, room.length - 4);
        console.log("PLAYER 1 : " + p1);
        let p2;

        for (let clientId in clients ) {
            //this is the socket of each client in the room.
            //sockets.push(io.sockets.connected[clientId].id);
            console.log("Socket nickname :" + io.sockets.connected[clientId].nickname);
            if (io.sockets.connected[clientId].nickname != p1) {
                p2 = io.sockets.connected[clientId].nickname;
            }
        }

        console.log("PLAYER 2 : " + p2);

        console.log("Socket length" + sockets.length);

        let userIDs = [];

        //get player 1
        for (let i =0; i < users.length; i++) {
            if (users[i].user == p1) {
                userIDs.push(i);
                sockets.push(users[i].socket);
            }
        }

        //get player 2
        for (let i = 0; i < users.length; i++) {
            if (users[i].user == p2) {
                userIDs.push(i);
                sockets.push(users[i].socket);
            }
        }

        //console.log("usernames: " + usernames);


        // for (let i =0; i < users.length; i++) {
        //     if (users[i].socket == sockets[0]) {
        //         userIDs.push(i);
        //     }
        // }
        //
        // for (let i =0; i < users.length; i++) {
        //     if (users[i].socket == sockets[1]) {
        //         userIDs.push(i);
        //     }
        // }

        //create a game object
        let deck = new Deck();
        deck.shuffle();
        let cards = deck.getCards();

        let players = [];
        let player1 = new Player(users[userIDs[0]].user, 0, sockets[0], 1);
        let player2 = new Player(users[userIDs[1]].user, 0, sockets[1], 2);

        players.push(player1);
        players.push(player2);

        let divisor = Math.floor(cards.length / 2)

        players[0].setHand(cards.slice(0, divisor));
        players[1].setHand(cards.slice(divisor, cards.length));
        let game = new Game(players);
        games.push(game);

        console.log("*****" + players[0].username + " cards**********");
        console.log(players[0].getHand());
        console.log("*****" + players[0].username + " cards**********");

        console.log("*****" + players[1].username + " cards**********");
        console.log(players[1].getHand());
        console.log("*****" + players[1].username + " cards**********");


        return game;
        // let hand1 = players[0].getHand();
        // let hand2 = players[1].getHand();
        //
        // for (let i = 0; i < hand1.length; i++) {
        //     console.log(`${hand1[i].rank} of ${hand1[i].suit}`);
        // }
        //
        // for (let i = 0; i < hand2.length; i++) {
        //     console.log(`${hand2[i].rank} of ${hand2[i].suit}`);
        // }

    }


});




server.listen(3000);
