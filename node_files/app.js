
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const parser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

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
        const user = {user: username, socket: socket.id};
        users.push(user);
    });

    //similar method for disconnect player

    socket.on('startGame', function(user) {
        //socket.leave(socket.room);

        if (rooms.length == 0) {
            const num = rooms.length+1;
            let new_room = "room" + num;
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
                console.log("******player sockets*********");
                console.log(players[0].getSocket());
                console.log(players[1].getSocket());
                console.log("******player sockets*********");
                // if (socket.id == players[0].socket) {
                //     socket.emit("cards", players[0].getHand());
                // }
                // else {
                //     socket.emit("cards", players[1].getHand());
                // }

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

                //game.playGame();
                //io.clients[players[0].getSocket()].send('cards', players[0].getHand());
                //io.clients[players[1].getSocket()].send('cards', players[1].getHand())
            });
        }
        else {
            let num = rooms.length+1;
            let new_room = "room" + num;
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

        for (let i = 0; i < games.length; i++) {
            if (socket.id == games[i].whoseTurn) {
                // console.log("")
                games[i].makeTurn(claimCards);
                let opponent;
                for (let x = 0; x < games[i].players.length; x++) {
                    if (games[i].players[x].socket != socket.id) {
                        io.sockets.sockets[games[i].players[x].getSocket()].emit('opponentmove', claimCards);
                    }
                }
            }
        }

    });

    function setup(room) {

        //find out whos in the room
        //console.log(io.sockets.manager.rooms);
        console.log(io.sockets.adapter.rooms[room]);
        let clients = io.sockets.adapter.rooms[room].sockets;
        let sockets = [];
        let userIDs = [];

        for (let clientId in clients ) {
            //this is the socket of each client in the room.
            sockets.push(io.sockets.connected[clientId].id);
        }
        console.log("Socket length" + sockets.length);

        for (let i =0; i < users.length; i++) {
            if (users[i].socket == sockets[0]) {
                userIDs.push(i);
            }
        }

        for (let i =0; i < users.length; i++) {
            if (users[i].socket == sockets[1]) {
                userIDs.push(i);
            }
        }

        //create a game object
        let deck = new Deck();
        deck.shuffle();
        cards = deck.getCards();

        let players = [];

        let player1 = new Player(users[userIDs[0]], 0, sockets[0]);
        let player2 = new Player(users[userIDs[1]], 0, sockets[1]);

        players.push(player1);
        players.push(player2);

        let divisor = Math.floor(cards.length / 2)

        players[0].setHand(cards.slice(0, divisor));
        players[1].setHand(cards.slice(divisor, cards.length));
        let game = new Game(players);
        games.push(game);

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
