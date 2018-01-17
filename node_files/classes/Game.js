module.exports = class Game {



  constructor(players) {
    this.players = players;
    this.turn = 0;
    this.gameOver = false;
    this.cardsOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];
    this.turnHand = [];
    this.selectedCards = [];
    this.Pile = [];
    this.currentCard = 0;
    this.winner;
    this.whoseTurn = players[0].socket;
  }

  playGame() {

    //   while (!this.gameOver) {
    //       //check if anyone won
    //       if (this.players[0].countHand() == 0) {
    //           console.log(`${this.players[0].username} won`);
    //           this.winner = this.players[0];
    //           this.gameOver = true;
    //       }
    //       else if (this.players[1].countHand() == 0) {
    //           console.log(`${this.players[1].username} won`);
    //           this.winner = this.players[1];
    //           this.gameOver = true;
    //       }
    //   }
  }

  whoseTurn() {
      return this.whoseTurn;
  }

  callCheat (caller, player) { 
      //checks if the player called bullshit
      //if the did they take the pile
      for (let i =0; i < turnHand.length; i++) {
          let caught = false;
  		    if (cardsOrder[currentCard] == turnHand[i].rank) {
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

	}

  makeTurn(selectedCards) { 
      this.turnHand = this.selectedCards;
      if (this.turn == this.cardsOrder.length) {
          this.turn = 0;
      }
      else {
          this.turn++;
      }
  }

}
