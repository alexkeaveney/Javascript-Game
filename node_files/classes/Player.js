module.exports = class Player {

  constructor(username, score, socket, playerNum) {
      this.username = username;
      this.score = score;
      this.socket = socket;
      this.hand = [];
      this.playerNum = playerNum;
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
      for (let i = 0; i < cards.length; i++) {
          this.hand.push(cards[i]);
      }
      console.log(this.username);
      console.log("😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡😡");
      console.log("Cards added to hand new length: " + this.hand.length);
      console.log("😜😜😜😜😜😜😜😜😜😜😜😜😜😜😜😜😜😜");
  }

  removeFromHand(cards) {
      for (let i =0; i < this.hand.length; i++) {
          for (let j = 0; j < cards.length; j++) {
              if (cards[j] == this.hand[i]) {
                  this.hand.splice(i, 1);
              }
          }
      }
      console.log(this.username);
      console.log("😘😘😘😘😘😘😘😘😘😘😘😘😘😘😘😘");
      console.log("Cards removed from hand new lenght = " + this.hand.length);
      console.log("😈😈😈😈😈😈😈😈😈😈😈😈😈😈😈😈");
  }

}
