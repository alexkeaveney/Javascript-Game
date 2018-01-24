module.exports = class Game {



  constructor(players) {
    this.players = players;
    this.gameOver = false;
    this.cardsOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];
    this.turnHand = [];
    this.selectedCards = [];
    this.pile = [];
    this.currentTurn = 0; //incremented at the end of a turn (after bullshit called)
    this.nextTurn = 0; //incremented after a player has made a move
    this.winner;
    this.whoseTurn = players[0].socket;
  }



  whoseTurn() {
      return this.whoseTurn;
  }

  dontCallCheat(socket) {

      if (this.currentTurn == this.cardsOrder.length) {
          this.currentTurn = 0;
      }
      else {
          this.currentTurn = this.currentTurn + 1;
      }

      this.whoseTurn = socket;

  }

  callCheat (caller, player) { 
      //checks if the player called bullshit
      //if the did they take the pile

      let caught = false;
      for (let i =0; i < this.turnHand.length; i++) {

  		    if (this.cardsOrder[this.currentTurn] != this.turnHand[i].rank) {
              caught = true;
          }
  	   }

       if (caught) {
            player.addtoHand(this.pile);
            this.pile = [];
            console.log(`${caller.username} caught you bullshitting, take the pile`);
       }
       else {
            caller.addtoHand(this.pile);
            this.pile = [];
            console.log(`${player.username} wasn't bullshitting, take the pile`);
       }

       if (this.currentTurn == this.cardsOrder.length) {
           this.currentTurn = 0;
       }
       else {
           this.currentTurn = this.currentTurn + 1;
       }

       this.whoseTurn = caller.socket;

       return caught;

	}

  makeTurn(selectedCards, socket) { 
      //this.turnHand = this.selectedCards;

      //remove the cards from this players hand
      let current_player;

      for (let i =0; i < this.players.length; i++) {
          if (this.players[i].socket == socket.id) {
              current_player = this.players[i];
          }
      }
      let cardsSelected = [];

      for (let i =0; i < current_player.getHand().length; i++) {
          for (let y = 0; y < selectedCards.length; y++) {
              if (current_player.getHand()[i].rank == selectedCards[y].rank && current_player.getHand()[i].suit == selectedCards[y].suit) {
                  cardsSelected.push(current_player.getHand()[i]);
              }
          }
      }
      current_player.removeFromHand(cardsSelected);

      for (let i =0; i < cardsSelected.length; i++) {
          this.pile.push(cardsSelected[i]);
      }

      this.turnHand = cardsSelected;

      if (this.nextTurn == this.cardsOrder.length) {
          this.nextTurn = 0;
      }
      else {
          this.nextTurn = this.nextTurn + 1;
      }
  }


  skipTurn(player) {
      if (player.socket == this.whoseTurn) {
          if (this.nextTurn == this.cardsOrder.length) {
              this.currentTurn = 0;
              this.nextTurn = 0;
          }
          else {
              this.nextTurn = this.nextTurn + 1;
              this.currentTurn = this.currentTurn + 1;
          }
          for (let i =0; i < this.players.length; i++) {
              if (this.players[i].socket != player.socket) {
                  this.whoseTurn = this.players[i].socket;
              }
          }
      }

  }

}
