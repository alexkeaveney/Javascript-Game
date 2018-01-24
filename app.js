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
app.use(express.static('js/lib'));
app.use(express.static('public'));


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/game.html');
});

const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://127.0.0.1:27017', (err, database) => {

    if (err) { console.log(err); }
    else {
        db = database.db('cheat');
    }

    app.listen(8000, () => {
        console.log('Database connected');
    });
});






io.on('connection', function(socket) {

    socket.emit("userList", users);

    socket.on('connectPlayer', function(username) {

        socket.nickname = username;
        let user_new;
        var collection = db.collection('users');

        collection.findOne({ name: username }, function (err, user) {
            if (err) { console.log(err); return;}
            else {
                if (user) {
                    user_new = {user: username, socket: socket.id, score: user.score};
                    users.push(user_new);
                }
                else {
                    user_new = {user: username, socket: socket.id, score: 0};
                    collection.insert({
                        name: username,
                        score: 0
                    });
                    users.push(user_new);
                }
            }
        });
    });

    //similar method for disconnect player
    //socket.leave(socket.room);

    socket.on('startGame', function(user) {

        if (rooms.length == 0) {

            let new_room = socket.nickname + "room";
            rooms.push(new_room);
            socket.join(new_room);
            socket.join(new_room, function () {
                io.sockets.to(new_room).emit('room', 'new room created');
            });
        }
        else if (io.sockets.adapter.rooms[rooms[rooms.length-1]].length < 2) {
            socket.room = rooms[rooms.length-1];
            socket.join(rooms[rooms.length-1], function () {
                io.sockets.to(rooms[rooms.length-1]).emit('room', 'game starting');
                let game = setup(rooms[rooms.length-1]);
                let players = game.players;

                let hand1 = [];
                let hand2 = [];

                for (let i =0; i < players[0].getHand().length; i++) {
                    hand1.push(players[0].getHand()[i]);
                }
                for (let i =0; i < players[1].getHand().length; i++) {
                    hand2.push(players[1].getHand()[i]);
                }

                io.sockets.sockets[players[0].getSocket()].emit('cards', {hand: hand1, move: true, turnCard: game.cardsOrder[game.nextTurn]});
                io.sockets.sockets[players[1].getSocket()].emit('cards', {hand: hand2, move: false, turnCard: game.cardsOrder[game.nextTurn]});

            });
        }
        else {
            let new_room = socket.nickname + "room";
            rooms.push(new_room);
            socket.room = new_room;
            socket.join(new_room, function () {
                io.sockets.to(new_room).emit('room', 'new room created');
            });
        }



    });

    socket.on('playerMove', function(claimCards) {

        for (let i = 0; i < games.length; i++) {

            if (socket.id == games[i].whoseTurn) {
                games[i].makeTurn(claimCards, socket);

                let opponent;


                for (let x = 0; x < games[i].players.length; x++) {
                    if (games[i].players[x].getSocket() != socket.id) {
                        io.sockets.sockets[games[i].players[x].getSocket()].emit('opponentmove', claimCards);
                    }
                }
            }
        }

    });

    socket.on('skipmove', function(bool) {
        if (bool) {
            let player;
            let game;
            for (let i = 0; i < games.length; i++) {
                for (let x = 0; x < games[i].players.length; x++) {
                    if (socket.id == games[i].players[x].socket) {
                        player = games[i].players[x];
                        games[i].skipTurn(player);
                        game = games[i];
                    }
                }
            }
            io.sockets.sockets[game.whoseTurn].emit('skipturn', {

                yourTurn: true,
                turnCard: game.cardsOrder[game.nextTurn]
            });
            io.sockets.sockets[socket.id].emit('skipturn', {
                yourTurn: false,
                turnCard: game.cardsOrder[game.nextTurn]
            });


        }

    });

    socket.on('bullshit', function(callBullshit) {

        if (callBullshit) {
            //check that its bullshit
            let caller;
            let player;
            let game;
            for (let i = 0; i < games.length; i++) {
                for (let x = 0; x < games[i].players.length; x++) {
                    if (socket.id == games[i].players[x].socket) {
                        caller = games[i].players[x];
                        game = games[i];
                    }
                    else {
                        player = games[i].players[x];
                    }

                }
                let result = games[i].callCheat(caller, player);


                let playerwin = 'none';
                let winner;

                if (player.getHand().length == 0) {
                    playerwin = player.username;
                    winner = player;
                }
                if (caller.getHand().length == 0) {
                    playerwin = caller.username;
                    winner = caller;
                }

                if (playerwin != 'none') {
                    try {
                       let collection = db.collection('users');
                       const new_score = winner.score + 10;
                       game.gameOver = true;
                       collection.updateOne(
                          { "name" : playerwin },
                          { $set: { "score" : new_score } }
                       );
                    } catch (e) {
                       print(e);
                    }
                }

                if (result) {
                    io.sockets.sockets[caller.getSocket()].emit('handresult', {
                        result: "You caught " + player.username + " bullshitting. They take the pile",
                        yourTurn: true,
                        turnCard: games[i].cardsOrder[games[i].nextTurn],
                        cards: caller.getHand(),
                        win: playerwin
                    });
                    io.sockets.sockets[player.getSocket()].emit('handresult', {
                        result: caller.username + " caught you bullshitting. You take the pile",
                        yourTurn: false,
                        turnCard: games[i].cardsOrder[games[i].nextTurn],
                        cards: player.getHand(),
                        win: playerwin
                    });
                }
                else {
                    io.sockets.sockets[caller.getSocket()].emit('handresult', {
                        result: player.username + " wasnt bullshitting. You take the pile",
                        yourTurn: true,
                        turnCard: games[i].cardsOrder[games[i].nextTurn],
                        cards: caller.getHand(),
                        win: playerwin
                    });
                    io.sockets.sockets[player.getSocket()].emit('handresult', {
                        result: caller.username + " called bullshit when you told the truth. They take the pile",
                        yourTurn: false,
                        turnCard: games[i].cardsOrder[games[i].nextTurn],
                        cards: player.getHand(),
                        win: playerwin
                    });
                }
            }
        }
        else {
            //move on to the next turn
            let caller, player, game;
            for (let i = 0; i < games.length; i++) {
                for (let x = 0; x < games[i].players.length; x++) {
                    if (socket.id == games[i].players[x].socket) {
                        caller = games[i].players[x];
                        game = i;
                    }
                    else {
                        player = games[i].players[x];
                    }
                }
            }

            let current_game = games[game];
            current_game.dontCallCheat(caller.socket);

            let current_card = games[game].nextTurn;
            let turn_card = current_game.cardsOrder[current_card];

            let playerwin = 'none';
            let winner;

            if (player.getHand().length == 0) {
                playerwin = player.username;
                winner = player;
            }
            if (caller.getHand().length == 0) {
                playerwin = caller.username;
                winner = caller;
            }

            if (playerwin != 'none') {
                try {
                   let collection = db.collection('users');
                   const new_score = winner.score + 10;
                   current_game.gameOver = true;
                   collection.updateOne(
                      { "name" : playerwin },
                      { $set: { "score" : new_score } }
                   );

                } catch (e) {
                   print(e);
                }
            }

            io.sockets.sockets[player.getSocket()].emit('nobullshit', {
                whoseTurn: caller.username,
                turnCard: turn_card,
                win: playerwin
            });
            io.sockets.sockets[caller.getSocket()].emit('nobullshit', {
                whoseTurn: caller.username,
                turnCard: turn_card,
                win: playerwin
            });

        }
    });

    socket.on('message', function(message) {

        // //fixes bug
        // if (message=="bye") {
        //     socket.broadcast.emit('message', message);
        // }
        // else {
            if (games !== undefined && games.length > 0) {
                for (let i = 0; i < games.length; i++) {
                     for (let x = 0; x < games[i].players.length; x++) {
                         if (games[i].players[x].getSocket() == socket.id) {
                             io.sockets.sockets[games[i].players[0].getSocket()].emit('message', message);
                             io.sockets.sockets[games[i].players[1].getSocket()].emit('message', message);
                         }
                     }
                }
            }
        //}


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

    socket.on('endgame', function(user) {
        //destroy the game, destroy the players
        //both players leave the room
        console.log("😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀");
        console.log(user + " ended the game");
        //console.log(io.sockets.adapter.sids[socket.id]);

        let room_name = Object.keys(io.sockets.adapter.sids[socket.id])[1];
        Object.keys(io.sockets.adapter.sids[socket.id])[1]

        console.log("🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠");

        console.log(io.sockets.adapter.rooms[room_name].sockets);
console.log("🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠🤠");
        //sends game over message to room

        io.to(room_name).emit('gameOver', user);

        console.log("😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀");
        // for (let i = 0; i < Object.keys(io.sockets.adapter.rooms[room_name].sockets).length; i++) {
        //     console.log("in sockets.length");
        //     let namespace = null;
        //     let ns = io.of(namespace || "/");
        //     let sock = ns.connected[Object.keys(io.sockets.adapter.rooms[room_name].sockets)[i]];
        //     sock.leave(room_name);
        // }

        // io.sockets.clients(room_name).forEach(function(s){
        //     s.leave(room_name);
        // });
        var clients_in_the_room = io.sockets.adapter.rooms[room_name].sockets;
        for (var clientId in clients_in_the_room ) {
            console.log('client: %s', clientId); //Seeing is believing
            var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
            client_socket.leave(room_name);
        }
        //console.log(sockets);
        console.log("🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓");


        //remove room
        rooms.splice(room_name, 1);

        //remove game
        for (let i = 0; i < games.length; i++) {
            if (games[i].gameOver) {
                games.splice(games[i], 1);
            }
        }

        //checks to see socket has left the room
        console.log(Object.keys(io.sockets.adapter.sids[socket.id]));
        console.log(Object.keys(io.sockets.adapter.sids[socket.id])[1]);





    });


    function setup(room) {

        //find out whos in the room
        console.log(io.sockets.adapter.rooms[room]);
        let clients = io.sockets.adapter.rooms[room].sockets;
        let sockets = [];
        let gameUsers = [];


        let p1 = room.substring(0, room.length - 4);
        let p2;



        for (let clientId in clients ) {
            //this is the socket of each client in the room.
            console.log("Socket nickname :" + io.sockets.connected[clientId].nickname);
            if (io.sockets.connected[clientId].nickname != p1) {
                p2 = io.sockets.connected[clientId].nickname;
            }
        }

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
        return game;

    }


});




server.listen(8080);
