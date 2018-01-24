
//node modules
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const parser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const os = require('os');
const MongoClient = require('mongodb').MongoClient;

//classes
const Card = require('./classes/Card.js');
const Deck = require('./classes/Deck.js');
const Game = require('./classes/Game.js');
const Player =  require('./classes/Player.js');

//variables
let clientCount = 0;
let users = [];
let db;
let rooms = [];
let games = [];

//access to different directories
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/classes'));
app.use(express.static(__dirname + '/public/images'));
app.use(express.static('js/lib'));
app.use(express.static('js'));
app.use(express.static('public'));

//send game.html on request for route directory localhost:8080
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/game.html');
});

//send howto.html on request for /howto directory localhost:8080/howto
app.get('/howto', function(req, res) {
    res.sendFile(__dirname + '/public/howto.html');
});

//connect to MongoDB
MongoClient.connect('mongodb://127.0.0.1:27017', (err, database) => {

    //if there is an error log it
    if (err) { console.log(err); }
    //if there are no errors
    else {
        //set db object to 'cheat' database
        db = database.db('cheat');
    }

    //listen for requests to db on port 8000
    app.listen(8000, () => {
        console.log('Database connected');
    });
});


///////////////////////////////////////////////////////////////////////////////////////////////////////
//      Socket messages
//////////////////////////////////////////////////////////////////////////////////////////////////////


/* when a conection has been made to the socket.io server */
io.on('connection', function(socket) {

    /* When a player connects */
    socket.on('connectPlayer', function(username) {

        //give the players socket a nickname of their username for identification
        socket.nickname = username;

        //holds user that connects
        let user_new;

        //holds db user collection
        let collection = db.collection('users');

        //read request for user of passed in username
        collection.findOne({ name: username }, function (err, user) {

            //if there is an error log it and return
            if (err) { console.log(err); return;}

            //check no error
            else {

                //checks user is not undefined (not in DB)
                if (user) {

                    //creates user object with score from DB
                    user_new = {user: username, socket: socket.id, score: user.score};

                    //puts the user in the users array
                    users.push(user_new);
                }

                //checks if user not in the DB
                else {

                    //creates user object with score of 0
                    user_new = {user: username, socket: socket.id, score: 0};

                    //inserts the new user into the DB
                    collection.insert({
                        name: username,
                        score: 0
                    });

                    //puts the new user in the users array
                    users.push(user_new);
                }
            } //close no errors
        }); //closes DB findOne block
    }); //end of socket message


    /* When a player presses the start game button */
    socket.on('startGame', function(user) {

        //if there are no rooms
        if (rooms.length == 0) {

            //create a new room with the username of the first person
            let new_room = socket.nickname + "room";

            //puts the new room in the rooms array
            rooms.push(new_room);

            //new user joins the room
            socket.join(new_room, function () {

                //the new user is sent a message saying that a new room was created
                io.sockets.to(new_room).emit('room', 'new room created');

            });
        }

        //the last room has only 1 player in it
        else if (io.sockets.adapter.rooms[rooms[rooms.length-1]].length < 2) {

            //sets the socket room to the last room
            socket.room = rooms[rooms.length-1];

            //user joins the last room
            socket.join(rooms[rooms.length-1], function () {

                //sets message to room that game is starting
                io.sockets.to(rooms[rooms.length-1]).emit('room', 'game starting');

                //creates new game
                let game = setup(rooms[rooms.length-1]);

                //gets the players in the new game
                let players = game.players;

                //holds the two players hands
                let hand1 = [];
                let hand2 = [];

                //creates the new hands from the players hands
                for (let i =0; i < players[0].getHand().length; i++) {
                    hand1.push(players[0].getHand()[i]);
                }
                for (let i =0; i < players[1].getHand().length; i++) {
                    hand2.push(players[1].getHand()[i]);
                }

                //sends the first player their cards and turn information
                io.sockets.sockets[players[0].getSocket()].emit('cards', {hand: hand1, move: true, turnCard: game.cardsOrder[game.nextTurn]});

                //sends the second player their cards and turn informaiton
                io.sockets.sockets[players[1].getSocket()].emit('cards', {hand: hand2, move: false, turnCard: game.cardsOrder[game.nextTurn]});

            }); //end of join room
        }

        //new room needs to be created
        else {

            //calls it room + username
            let new_room = socket.nickname + "room";

            //puts the new room in the rooms array
            rooms.push(new_room);

            //sets the socket room to the new room
            socket.room = new_room;

            //joins the new room
            socket.join(new_room, function () {

                //sends message to player that a room has been created
                io.sockets.to(new_room).emit('room', 'new room created');
            });
        }

    }); //end of start game message

    /* This message contains the players turn */
    socket.on('playerMove', function(claimCards) {

        //loops through the games
        for (let i = 0; i < games.length; i++) {

            //finds the game the player is in
            if (socket.id == games[i].whoseTurn) {

                //makes the players move
                games[i].makeTurn(claimCards, socket);

                //loops through the games players
                for (let x = 0; x < games[i].players.length; x++) {

                    //finds the opponent
                    if (games[i].players[x].getSocket() != socket.id) {

                        //sends the players move to the opponent (for testing)
                        io.sockets.sockets[games[i].players[x].getSocket()].emit('opponentmove', claimCards);
                    }
                }
            }
        }

    }); //end of player move message

    /* message received if player skips their turn */
    socket.on('skipmove', function(bool) {

        //if its true
        if (bool) {

            //hold player and game
            let player, game;

            //loops through games
            for (let i = 0; i < games.length; i++) {
                //loops through players in each game
                for (let x = 0; x < games[i].players.length; x++) {
                    //finds the player skipping a move
                    if (socket.id == games[i].players[x].socket) {

                        //set object that holds player
                        player = games[i].players[x];

                        //passes the player into skip turn
                        games[i].skipTurn(player);

                        //gets the current game
                        game = games[i];
                    }
                }
            }

            //sends message to other player that it is their turn now and their turn card
            io.sockets.sockets[game.whoseTurn].emit('skipturn', {

                yourTurn: true,
                turnCard: game.cardsOrder[game.nextTurn]
            });

            //sends message to player that its the other players turn and their turn card
            io.sockets.sockets[socket.id].emit('skipturn', {
                yourTurn: false,
                turnCard: game.cardsOrder[game.nextTurn]
            });


        }

    }); //end of skip move message

    /* called when a player calls bullshit / does not call bullshit on another player */
    socket.on('bullshit', function(callBullshit) {

        //if the call is true
        if (callBullshit) {

            //holds this caller, player and game for identification
            let caller, player, game;

            //loops through the games
            for (let i = 0; i < games.length; i++) {

                //loops through the players in the games
                for (let x = 0; x < games[i].players.length; x++) {

                    //finds the caller
                    if (socket.id == games[i].players[x].socket) {
                        //sets the caller and the game
                        caller = games[i].players[x];
                        game = games[i];
                    }

                    //finds the player
                    else {
                        //sets the player
                        player = games[i].players[x];
                    }

                }

                //calls cheat on the player in the game and gets the result
                let result = games[i].callCheat(caller, player);

                //default no winner
                let playerwin = 'none';

                //holds possible winner
                let winner;

                //checks if the player has no more cards
                if (player.getHand().length == 0) {
                    //sets winner name and player object
                    playerwin = player.username;
                    winner = player;
                }

                //checks if the caller has no more cards
                if (caller.getHand().length == 0) {
                    //sets winner name and player object
                    playerwin = caller.username;
                    winner = caller;
                }

                //if there is a winner
                if (playerwin != 'none') {
                    //attempt
                    try {

                       //gets users collection
                       let collection = db.collection('users');

                       //sets new score for winner (adds 10)
                       const new_score = winner.score + 10;

                       //sets gameover to true
                       game.gameOver = true;

                       //updates the winners score in the DB
                       collection.updateOne(
                          { "name" : playerwin },
                          { $set: { "score" : new_score } }
                       );

                     //if any error
                    } catch (e) {
                        //logs the error
                       console.log(e);
                    }
                }

                //checks if the player was cheating
                if (result) {

                    //sends call result, turn card, whose turn it is, players cards and winner (if someone won)
                    io.sockets.sockets[caller.getSocket()].emit('handresult', {
                        result: "You caught " + player.username + " bullshitting. They take the pile",
                        yourTurn: true,
                        turnCard: games[i].cardsOrder[games[i].nextTurn],
                        cards: caller.getHand(),
                        win: playerwin
                    });

                    //sends call result, turn card, whose turn it is, players cards and winner (if someone won)
                    io.sockets.sockets[player.getSocket()].emit('handresult', {
                        result: caller.username + " caught you bullshitting. You take the pile",
                        yourTurn: false,
                        turnCard: games[i].cardsOrder[games[i].nextTurn],
                        cards: player.getHand(),
                        win: playerwin
                    });
                }

                //player wasn't cheating
                else {

                    //sends call result, turn card, whose turn it is, players cards and winner (if someone won)
                    io.sockets.sockets[caller.getSocket()].emit('handresult', {
                        result: player.username + " wasnt bullshitting. You take the pile",
                        yourTurn: true,
                        turnCard: games[i].cardsOrder[games[i].nextTurn],
                        cards: caller.getHand(),
                        win: playerwin
                    });

                    //sends call result, turn card, whose turn it is, players cards and winner (if someone won)
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

        //if the opponent did not call cheat
        else {

            //used to hold the players and the game
            let caller, player, game;

            //loop through the games
            for (let i = 0; i < games.length; i++) {

                //loops through the players in the game
                for (let x = 0; x < games[i].players.length; x++) {

                    //gets caller and game
                    if (socket.id == games[i].players[x].socket) {
                        caller = games[i].players[x];
                        game = i;
                    }

                    //gets player
                    else {
                        player = games[i].players[x];
                    }
                }
            }

            //current game in the array
            let current_game = games[game];

            //player doesnt call cheat method to advance the game
            current_game.dontCallCheat(caller.socket);

            //card index for next turn
            let current_card = games[game].nextTurn;

            //card for next turn
            let turn_card = current_game.cardsOrder[current_card];

            //default no winner
            let playerwin = 'none';

            //holds possible winner object
            let winner;

            //checks if the player has any cards left
            if (player.getHand().length == 0) {

                //sets winner username
                playerwin = player.username;

                //sets winner object
                winner = player;
            }

            //checks if the caller has any cards left
            if (caller.getHand().length == 0) {

                //sets winner username
                playerwin = caller.username;

                //sets winner object
                winner = caller;
            }

            //if there is a winner
            if (playerwin != 'none') {

                //attempt
                try {

                    //get users collection from the db
                   let collection = db.collection('users');

                   //sets the new score
                   const new_score = winner.score + 10;

                   //sets game over to true
                   current_game.gameOver = true;

                   //updates the winners score in the DB
                   collection.updateOne(
                      { "name" : playerwin },
                      { $set: { "score" : new_score } }
                   );
                  //if there are any errors
                } catch (e) {
                    //log them
                    console.log(e);
                }
            }

            //sends message of next turn and winner if there is one to both players
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
    }); //end of no cheat message

    /* Messages sent for Web-RTC */
    socket.on('message', function(message) {

        //if there are games
        if (games !== undefined && games.length > 0) {

            //loop through the games
            for (let i = 0; i < games.length; i++) {
                //loops through the players of the games
                for (let x = 0; x < games[i].players.length; x++) {
                    //if the sender is in the game
                    if (games[i].players[x].getSocket() == socket.id) {
                        //send the message to both players in the game
                        io.sockets.sockets[games[i].players[0].getSocket()].emit('message', message);
                        io.sockets.sockets[games[i].players[1].getSocket()].emit('message', message);
                    }
                }
            }
        }

    }); //end Web-RTC messages

    //Web RTC message
    socket.on('ipaddr', function() {

        //gets network type
      var ifaces = os.networkInterfaces();
      for (var dev in ifaces) {
        ifaces[dev].forEach(function(details) {
            //sends details of network type e.g. on internet IPv4 or localhost
          if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
            socket.emit('ipaddr', details.address);
          }
        });
      }
    });

    //removes the finished game and players
    socket.on('endgame', function(user) {

        //gets the name of the room
        let room_name = Object.keys(io.sockets.adapter.sids[socket.id])[1];

        //sends game over message to room
        io.to(room_name).emit('gameOver', user);

        //finds the client sockets in the room
        var clients_in_the_room = io.sockets.adapter.rooms[room_name].sockets;

        //loops through the sockets
        for (var clientId in clients_in_the_room ) {

            //sets the individual sockets
            var client_socket = io.sockets.connected[clientId];

            //leaves the room
            client_socket.leave(room_name);
        }

        //remove room from the rooms array
        rooms.splice(room_name, 1);

        //remove game from the games array
        for (let i = 0; i < games.length; i++) {
            if (games[i].gameOver) {
                games.splice(games[i], 1);
            }
        }

    });
}); //end of game over message

///////////////////////////////////////////////////////////////////////////////////////////////////////
//       Functions
//////////////////////////////////////////////////////////////////////////////////////////////////////

/* This function is called to setup a new game */
function setup(room) {

    //find out whos in the room
    let clients = io.sockets.adapter.rooms[room].sockets;

    //holds the client sockets
    let sockets = [];

    //holds the users
    let gameUsers = [];

    //gets p1 from subtracting room from the end of the room name
    let p1 = room.substring(0, room.length - 4);

    //holds player 2
    let p2;

    //loops through the socket clients
    for (let clientId in clients ) {

        //if not p1
        if (io.sockets.connected[clientId].nickname != p1) {
            //sets player 2
            p2 = io.sockets.connected[clientId].nickname;
        }
    }

    //holds user ids
    let userIDs = [];

    //get player 1
    for (let i =0; i < users.length; i++) {
        if (users[i].user == p1) {
            //puts user id and socket into arrays
            userIDs.push(i);
            sockets.push(users[i].socket);
        }
    }

    //get player 2
    for (let i = 0; i < users.length; i++) {
        if (users[i].user == p2) {
            //puts user id and socket into arrays
            userIDs.push(i);
            sockets.push(users[i].socket);
        }
    }

    //creates a new deck
    let deck = new Deck();

    //shuffles the deck
    deck.shuffle();

    //gets the cards out of the deck
    let cards = deck.getCards();

    //array to hold the players
    let players = [];

    //creates new player objects
    let player1 = new Player(users[userIDs[0]].user, users[userIDs[0]].score, sockets[0], 1);
    let player2 = new Player(users[userIDs[1]].user, users[userIDs[0]].score, sockets[1], 2);

    //puts them in the array
    players.push(player1);
    players.push(player2);

    //gets half the deck
    let divisor = Math.floor(cards.length / 2)

    //sets the first players hand to the first half of the deck
    players[0].setHand(cards.slice(0, divisor));

    //sets the second players hand to the second half of the deck
    players[1].setHand(cards.slice(divisor, cards.length));

    //creates a new game with the players
    let game = new Game(players);

    //puts the game in an array
    games.push(game);

    //returns the game object
    return game;

}

//start server listening on port 8080
server.listen(8080);
