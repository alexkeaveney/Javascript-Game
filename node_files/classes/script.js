
//const Game = require('Game.js');


// Instantiate Game:
//let new_game = new Game();
//const Deck = require('Deck.js');

let deck = new Deck();
deck.shuffle();
cards = deck.getCards();

let players = [];

let player1 = new Player("User1", 0);
let player2 = new Player("User2", 0);

players.push(player1);
players.push(player2);

let pile = []; //holds cards that have been put down

let divisor = Math.floor(cards.length / 2)

players[0].setHand(cards.slice(0, divisor));
players[1].setHand(cards.slice(divisor, cards.length));

let hand1 = players[0].getHand();
let hand2 = players[1].getHand();

for (let i = 0; i < hand1.length; i++) {
    console.log(`${hand1[i].rank} of ${hand1[i].suit}`);
}

for (let i = 0; i < hand2.length; i++) {
    console.log(`${hand2[i].rank} of ${hand2[i].suit}`);
}
