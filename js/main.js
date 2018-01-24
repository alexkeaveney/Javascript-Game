
//connection to node server
const socket = io.connect();

//dom elements
const messages = document.getElementById('messages');
const startButton = document.getElementById('startButton');
const cardHolder = document.getElementById('cardHolder');
const remoteVideo = document.getElementById('remoteVideo');
const loginButton = document.getElementById('loginButton');
const skipButton = document.getElementById('skip');
const claimButton = document.getElementById('claim');
const bullshitButton = document.getElementById('bullshit');
const usernameField = document.getElementById('username');
const error = document.getElementById('error');

//variables for game & username
let yourTurn = false;
let turnCard = "";
let cards = [];
let selectedCards = [];
let buttons = [];
let name = "";
let interval;

///////////////////////////////////////////////////////////////////////////////////////////////////////
//      Event Listeners
//////////////////////////////////////////////////////////////////////////////////////////////////////


startButton.addEventListener('click', function() {
    //when clicked send message to node to start the game
    socket.emit('startGame', username);
    //hide start button, show video and player cards
    startButton.style.display = 'none';
    cardHolder.style.display = 'block';
    remoteVideo.style.display = 'block';
});

loginButton.addEventListener('click', function() {
    if (username==="") {
        error.innerHTML = "You have not typed in a username";
    }
    else {
        name = usernameField.value;             //set name to hold username for game
        socket.emit ('connectPlayer', name);    //send connect player message to node with username
        //set messages to user
        error.innerHTML = "";
        messages.innerHTML = "Player Connected";
        //hide and show buttons
        usernameField.style.display = 'none';
        loginButton.style.display = 'none';
        startButton.style.display = 'block';
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
//      Functions
//////////////////////////////////////////////////////////////////////////////////////////////////////

/* This function is used to communicate with the server when setting up Web RTC */
function sendMessage(message) {

    //sends message to server
    socket.emit('message', message);

}

/* This function hides the game elements from the user (at the end of the game) */
function removeGameElements() {

    //hides video and card holder
    remoteVideo.style.display = 'none';
    cardHolder.style.display = 'none';

}

/* This function is used to reset a hand after each turn  */
function resetHand(hand) {

    //clears card holder
    for (let i = 0; i < cards.length; i++) {
        cardHolder.removeChild(cards[i].button);
    }

    //empty cards array
    cards = [];

    //clears the interval for the bullshit button from the previous turn
    clearInterval(interval);

    //makes new buttons for hand, adds them as cards and puts the buttons in the card holder
    for (let i = 0; i < hand.length; i++) {

        let btn = document.createElement("BUTTON");                 // Create a <button> element
        let t = document.createTextNode(hand[i].rank);              // Create a text node
        btn.setAttribute("id", `${hand[i].rank}${hand[i].suit}`);   // Sets button id to card hand & rank
        btn.addEventListener('click', function() {                  //creates event listener for button
            if (yourTurn) {
                selectCard(`${hand[i].rank}${hand[i].suit}`);   //passes the rank and suit into selectCard function
            }
        });
        btn.appendChild(t);     // Append the text to <button>
        let imageLink = `/images/${hand[i].rank}_of_${hand[i].suit.toLowerCase()}.png`;   //uses rank and suit to create image link
        btn.innerHTML = "<img height='80' width='50' src='" + imageLink + "'/>";    //sets height, width and link of button image

        //creates a new cards and puts it in the cards array
        cards.push({
            suit: hand[i].suit,
            rank: hand[i].rank,
            button: btn
        });

        //puts the button in the card holder
        cardHolder.appendChild(btn);
    }
}

/* This function is used to call bullshit on opponents turn */
function bullshit(bool) {

    //clears bullshit timer for this turn
    clearInterval(interval);

    //sends a bullshit true call to the server
    socket.emit('bullshit', bool);

    //hides the bullshit button
    bullshitButton.style.display = 'none';
}

/* This function is used to skip a players turn */
function skip() {

    //hides skip and claim buttons
    claimButton.style.display = 'none';
    skipButton.style.display = 'none';

    //sends skip move message to server
    socket.emit('skipmove', true);

}

/* This function is used to put down cards on players turn */
function claim() {

    //player must select at least one card (or press skip)
    if (selectedCards.length > 0) {

        //hides claim and skip button
        claimButton.style.display = 'none';
        skipButton.style.display = 'none';

        //displays message
        messages.innerHTML = "Waiting on opponents response...";

        //creates array to convert and hold the selected values to a card object
        let selectedObjects = [];

        for (let i =0; i < selectedCards.length; i++) {
            for (let x =0; x < cards.length; x++) {
                //goes through selectedcards and cards if they overlap put in selected objects
                if (selectedCards[i].includes(cards[x].rank) && selectedCards[i].includes(cards[x].suit)) {
                    selectedObjects.push(cards[x]);             //puts card in selected objects
                    cardHolder.removeChild(cards[x].button);    //remove the cards from players hand
                    cards.splice(x, 1);                         //removes card from players hand
                }
            }
        }

        //empty selected cards
        selectedCards = [];

        //send move to server
        socket.emit('playerMove', selectedObjects);
    }
    //called if the user doesnt select a card
    else {
        messages.innerHTML = "You must select at least 1 card";
    }
}

/* This function selects a card / deselects them if already selected */
function selectCard(card) {

    //boolean to check if card has already been selected
    let alreadySelected = false;

    //loops through selected cards
    for (let i = 0; i < selectedCards.length; i++) {

        //if card is already in selected cards
        if (card == selectedCards[i]) {
            //change already selected to true
            alreadySelected = true;
        }

    }

    //if the card is already selected
    if (alreadySelected) {

        //gets the index of the card
        const index = selectedCards.indexOf(card);

        //removes the card from the selected cards array
        selectedCards.splice(index, 1);

        //changes the button background back to white
        document.getElementById(card).style.background = 'white';

    }

    //player cannot select more than 4 cards unless username = 'a' for testing
    if (selectedCards.length < 4 || name == 'a') {

        //if its not already selected
        if (!alreadySelected) {

            //put the card in the selected cards array
            selectedCards.push(card);

            //turns the card buttons background to green
            document.getElementById(card).style.background = '#2ecc71';
        }
    }

    //player has already selected 4 cards
    else {
        //notify the player
        messages.innerHTML = "You cannot select more than 4 cards";
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////
//      Socket messages
//////////////////////////////////////////////////////////////////////////////////////////////////////

/* This message comes in when the player enters the room */
socket.on('room', function(message) {

    //notifies the user
    messages.innerHTML = message;

    //first person in the room
    if (message=='new room created') {

        //this is used for Web-RTC (this user becomes the initiator of the call)
        isInitiator = true;

    }

    //second player in the room
    else {

        //this is used to start the call with the second player
        isChannelReady = true;

        //gets web cam feed for this user
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        })
        .then(gotStream)        //calls the gotStream function when it retrieves the feed
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);   //problem connecting to feed
        });
    }

}); //ends socket message

/* These messages are in relation to Web RTC */
socket.on('message', function(message) {

    if (message === 'got user media') {
        maybeStart();
    }
    else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
            maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    }
    else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
    }
    else if (message.type === 'candidate' && isStarted) {
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
    }
    else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    }
}); //ends socket message

/* This message is sent in the beginning with the players card */
socket.on('cards', function(message) {


    //sets if its your turn or not
    yourTurn = message.move;

    //sets turn card for message
    turnCard = message.turnCard;

    //if its your turn
    if (yourTurn) {

        //notifies player of cards to play for this turn
        messages.innerHTML = "It is your turn to play " + turnCard + "'s";

        //shows claim and skip buttons
        claimButton.style.display = 'inline';
        skipButton.style.display = 'inline';
    }
    //not your turn
    else {

        //notifies player of what his opponent has to play
        messages.innerHTML = "Its your opponents turn to play " + turnCard + "s";
    }

    //sets players hand
    resetHand(message.hand);

}); //end of socket message

//This message comes after opponent has put down cards
socket.on('opponentmove', function(cards) {

    //shows bullshit button
    bullshitButton.style.display = 'block';

    //shows opponents claim
    messages.innerHTML = "Your opponent claims " + cards.length + " " + turnCard + "s";

    //bullshit timer in seconds
    let seconds = 5,
    second = 0;

    //starts bullshit timer
    interval = setInterval(function() {

        //time left
        let num = seconds - second;

        //displays time left on button
        bullshitButton.innerHTML = `Bullshit(${num})`;

        //timer ran out
        if (second >= seconds) {

            //bullshit call false (didnt click in time)
            bullshit(false);

            //removes timer
            clearInterval(interval);
        }

        //adds a second
        second++;

    }, 1000);   //every 1 second run the script above

});

/* This message is recieved if no bullshit was called on the last turn */
socket.on('nobullshit', function(message) {

    //if no one won
    if (message.win=="none") {

        //checks if its this players go
        if (message.whoseTurn == name) {

            //sets flag to true
            yourTurn = true;

            //sets new turn card for this turn
            turnCard = message.turnCard;

            //notifies player of their turn card
            messages.innerHTML = "It's your turn to play " + turnCard + "s";

            //shows claim and skip buttons
            claimButton.style.display = 'inline';
            skipButton.style.display = "inline";

        }

        //not this players turn
        else {

            //flag set to false (so they cant make a move)
            yourTurn = false;

            //sets new card for this turn
            turnCard = message.turnCard;

            //notifies player of opponents turn card
            messages.innerHTML = "It's your opponents turn to play " + turnCard + "s";
        }
    }

    //checks if this player won
    else if (message.win == name) {

        //notifies player of win
        messages.innerHTML = "You win";

        //hides game elements
        removeGameElements();

        //sends message to hangup web rtc call
        socket.emit('message', 'bye');

        //sends message to end game
        socket.emit('endgame', name);

    }

    //check if opponent won
    else {

        //notifies player of loss
        messages.innerHTML = "You lose";

        //empties their cards
        cards = [];

        //loops through cardholder
        while (cardHolder.firstChild) {

            //removes card
            cardHolder.removeChild(cardHolder.firstChild);

        }

        //hides game elements
        removeGameElements();

        //hangs up Web-RTC call
        socket.emit('message', 'bye');

    }

}); //ends socket message

/* This message is received after a hand if bullshit was called*/
socket.on('handresult', function(message) {

    //notifies the user of result of last hand
    messages.innerHTML = message.result;

    //sets whose turn it is
    yourTurn = message.yourTurn;

    //sets card for this turn
    turnCard = message.turnCard;

    //no one won - continue game
    if (message.win == "none") {

        //if its this players turn
        if (yourTurn) {

            //notify player of their turn card
            messages.innerHTML = "It is your turn to play " + message.turnCard + "'s";

            //shows claim and skip buttons
            claimButton.style.display = 'inline';
            skipButton.style.display = 'inline';

        }

        //notify player of opponent turn and turn card
        else {
            messages.innerHTML = "Its your opponents turn to play " + message.turnCard + "s";
        }

        resetHand(message.cards);

    }

    //check if this player won
    else if(message.win == name) {

        //notify player of win
        messages.innerHTML = "You won!";

        //hangs up the Web-RTC call
        socket.emit('message', 'bye');

        //hides game elements
        removeGameElements();

        //sends message to server to end the game
        socket.emit('endgame', name);

    }

    //checks if opponent won
    else {

        //notifies player of loss
        messages.innerHTML = "You lost";

        //clears the players cards
        cards = [];

        //loops through card holder
        while (cardHolder.firstChild) {
            //removes card
            cardHolder.removeChild(cardHolder.firstChild);
        }

        //hides game elements
        removeGameElements();

        //hangs up Web-RTC Call
        socket.emit('message', 'bye');

    }

}); //ends socket message

socket.on('skipturn', function(message) {

    //checks if it is this players turn
    if (message.yourTurn) {

        //sets your turn to true
        yourTurn = true;

        //sets turn card for this turn
        turnCard = message.turnCard;

        //notifies player of their turn and turn card
        messages.innerHTML = "It's your turn to play " + turnCard + "s";

        //shows claim and skip buttons
        claimButton.style.display = 'inline';
        skipButton.style.display = "inline";

    }

    //checks if it is the opponents turn
    else {

        //sets your turn to false (you cant make a move)
        yourTurn = false;

        //sets card for this turn
        turnCard = message.turnCard;

        //notifies player of opponents turn and turn card
        messages.innerHTML = "It's your opponents turn to play " + turnCard + "s";

    }

}); //end of socket message

socket.on('gameOver', function(winner) {

    //shows start button so player can play another game
    startButton.style.display = 'block';

    //instructs the user to start a new game
    document.getElementById('messages').innerHTML = "Game over press the start button to start a new game";

}); //end of socket message
