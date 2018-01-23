module.exports = class Game {



  constructor(players) {
    this.players = players;
    this.turn = 0;
    this.gameOver = false;
    this.cardsOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];
    this.turnHand = [];
    this.selectedCards = [];
    this.pile = [];
    this.currentCard = 0;
    this.winner;
    this.whoseTurn = players[0].socket;
  }



  whoseTurn() {
      return this.whoseTurn;
  }

  dontCallCheat(socket) {

    //   if (this.turn == this.cardsOrder.length) {
    //       this.turn = 0;
    //   }
    //   else {
    //       this.turn = this.turn + 1;
    //   }

    //   for (let i = 0; i < this.players.length; i++) {
    //       if (this.players[i].socket != socket) {
    //           this.whoseTurn = this.players[i].socket;
    //       }
    //   }

  }

  callCheat (caller, player) { 
      //checks if the player called bullshit
      //if the did they take the pile

      console.log("Cheat called in game class");

      console.log(caller);
      console.log(player);

      let caught = false;
      for (let i =0; i < this.turnHand.length; i++) {

  		    if (this.cardsOrder[this.currentCard] != this.turnHand[i].rank) {
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

       this.whoseTurn = caller.socket;

       return caught;

	}

  makeTurn(selectedCards, socket) { 
      //this.turnHand = this.selectedCards;

      //remove the cards from this players hand
      let current_player;

      console.log("passed in socket" + socket.nickname);




      for (let i =0; i < this.players.length; i++) {
          console.log("Player" + (i+1) + " socket: " + this.players[i].socket);
          if (this.players[i].socket == socket.id) {
              current_player = this.players[i];
          }
      }
      console.log("Current player " + current_player.username);
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
      console.log("***************Pile******************");
      console.log(this.pile);
      console.log("***************Pile******************");
      //console.log(cardsSelected);

      //put them in the pile

      //allow the other user to call bullshit

      this.turnHand = cardsSelected;

      if (this.turn == this.cardsOrder.length) {
          this.turn = 0;
      }
      else {
          this.turn = this.turn + 1;
      }
  }

}
