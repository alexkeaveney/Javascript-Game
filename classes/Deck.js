// @flow
const Card = require('./Card.js');

module.exports = class Deck {

    constructor() {

        this.suits = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
        this.cards = [];

        for (let i = 0; i < this.suits.length; i++) {
            for (let x = 0; x < this.ranks.length; x++) {
                this.cards.push(new Card(this.suits[i], this.ranks[x]));
            }
        }

    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        return this.cards;
    }

    getCards() {
        return this.cards;
    }
}
