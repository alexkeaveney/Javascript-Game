module.exports = class Player {

  constructor(username, score, socket) {
      this.username = username;
      this.score = score;
      this.socket = socket;
      this.hand = [];
  }

  getSocket() {
      return this.socket;
  }

  setHand(cards) {
      this.hand = cards;
  }

  getHand() {
      return this.hand;
  }

  countHand() {
      return this.hand.length;
  }

  addtoHand(cards) {
      for (let i = 0; i < this.cards.length; i++) {
          this.hand.push(cards[i]);
      }
  }

  removeFromHand(cards) {
      for (let i =0; i < this.hands.length; i++) {
          for (let j = 0; j < this.cards.length; j++) {
              if (this.cards[j] == this.hand[i]) {
                  this.hand.splice(i, 1);
              }
          }
      }
  }

}
