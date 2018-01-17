module.exports = class Card {

    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }

    compare(card) {
        if (card.rank == this.rank) {
            return true;
        }
        else {
            return false;
        }
    }

    print() {
        console.log(`${this.rank} of ${this.suit}`);
    }

}
