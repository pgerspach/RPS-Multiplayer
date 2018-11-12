$(document).ready(function() {
  var wins = 0;
  var losses = 0;
  var numPlay = 0;
  var oppName;
  var sendM = false;
  var config = {
    //apiKey: "AIzaSyBvUs9nIRhm-wmv6Pqwd6kerxL204yA0vA",
    authDomain: "gfb1-16566.firebaseapp.com",
    databaseURL: "https://gfb1-16566.firebaseio.com",
    projectId: "gfb1-16566",
    storageBucket: "gfb1-16566.appspot.com",
    messagingSenderId: "820389293762"
  };
  var localPlayerNumber;
  firebase.initializeApp(config);
  var database = firebase.database();
  //const messaging = firebase.messaging();

  function promptName() {
    var nameLabel = $("<label>");
    nameLabel.text("Player Name:");
    nameLabel.attr("id", "nameInputLabel");

    var inputName = $("<input>");
    inputName.attr("type", "name");
    inputName.attr("id", "playerNameInput");
    inputName.attr("type", "text");

    var nameSubmit = $("<input>");
    nameSubmit.attr("type", "submit");
    nameSubmit.attr("id", "nameSubmit");
    nameSubmit.attr("value", "Start");

    var nameForm = $("<form>");
    nameForm.append(nameLabel);
    nameForm.append(inputName);
    nameForm.append(nameSubmit);

    $(".messageBoard").append(nameForm);
  }

  promptName();

  $("#nameSubmit").on("click", function(event) {
    event.preventDefault();
    var playerName = $("#playerNameInput").val();

    var ref = database.ref();
    ref.once("value").then(function(snapshot) {
      if (snapshot.child("players").exists()) {
        if (snapshot.child("players").numChildren() < 2) {
          if (!snapshot.child("players/2").exists()) {
            var playerNumber = 2;
            newPlayer(playerNumber, playerName);
          } else {
            var playerNumber = 1;
            newPlayer(playerNumber, playerName);
          }
          localPlayerNumber = playerNumber;
        }
      } else {
        var playerNumber = 1;
        localPlayerNumber = playerNumber;
        newPlayer(playerNumber, playerName);
      }
    });
    $(".messageBoard").html(`Welcome ${playerName}`);
    var newMessage = $("<input>");
    newMessage.attr("id", "messageInput");

    var newMessageSubmit = $("<input>");
    newMessageSubmit.attr("type", "submit");
    newMessageSubmit.attr("id", "messageSubmit");
    newMessageSubmit.attr("value", "Send");

    var nameForm = $("<form>");
    nameForm.append(newMessage);
    nameForm.append(newMessageSubmit);
    var messageHistory = $("<div>");
    messageHistory.attr("id", "messageHistory");
    $(".chatBox").append(messageHistory);

    $(".chatBox").append(nameForm);

    $("#messageSubmit").on("click", function(event) {
      event.preventDefault();
      console.log("HEREINMESSAGESUBMIT");
      var message = $("#messageInput").val();
      message = `${localPlayerNumber} ` + message;
      $("#messageInput").val("");
      var messageRef = database.ref("messages");
      sendM = true;
      messageRef.push({message:message});
      messageRef.onDisconnect().remove();
    });
    database.ref(`messages`).on("child_added", function(snapshot) { //Display messages!
      var sentMessage = snapshot.child("message").val();
      console.log("snapshot child: " +snapshot.child("message").val());
      var whichPlayer = sentMessage.slice(0, 1);
      //var whichPlayer = 0;
      var playerMessage = $("<div>");
      playerMessage.text(sentMessage.slice(1));
      playerMessage.attr("class", "sentMessage");
      if (whichPlayer == localPlayerNumber) {
        playerMessage.attr("id", "p-local");
      } else {
        playerMessage.attr("id", "p-opp");
      }
      $("#messageHistory").append(playerMessage);
    });
  });

 

  

  function newPlayer(playerNumber, playerName) {
    database.ref(`/players/${playerNumber}`).set({
      name: playerName,
      number: playerNumber
    });
    database.ref(`/results/${playerNumber}`).set({
      wins: wins,
      losses: losses,
      number: playerNumber
    });
    var con = database.ref(`/players/${playerNumber}`);
    var con2 = database.ref(`/results/${playerNumber}`);
    con2.onDisconnect().remove();
    con.onDisconnect().remove();
    displayChoices(playerNumber);
  }

  function displayChoices(pNumber) {
    // Called when there is a new player, when a match ends, and when someone disconnects
    database
      .ref(`/players/${pNumber}`)
      .once("value")
      .then(function(snapshot) {
        var pName = snapshot.val().name;
        var rock = $("<div>");
        rock.attr("class", "rps");
        rock.attr("value", "rock"); /// Display ROCK
        rock.html("ROCK");

        var paper = $("<div>");
        paper.attr("class", "rps");
        paper.attr("value", "paper"); /// Display PAPAER
        paper.html("PAPER");

        var scissors = $("<div>");
        scissors.attr("class", "rps");
        scissors.attr("value", "scissors"); /// Display SCISSORS
        scissors.html("SCISSORS");

        $(`.playerChoice-${pNumber}`).html("");
        $(`.playerName-${pNumber}`).html(pName);
        var wins = 0; // RESET WINS AND LOSSES
        var losses = 0;
        database
          .ref(`/results/${pNumber}`)
          .once("value")
          .then(function(snap) {
            wins = snap.val().wins; // GET WINS AND LOSSES AND UPDATE!
            losses = snap.val().losses;
            $(`.playerStats-${pNumber}`).html(
              `Wins: ${wins} Losses: ${losses}`
            );
          });

        if (pNumber == localPlayerNumber) {
          $(`.playerChoice-${pNumber}`).append(rock); // ONLY SHOW OPTIONS IF THE DATA BELONGS TO THE LOCAL PLAYER
          $(`.playerChoice-${pNumber}`).append(paper);
          $(`.playerChoice-${pNumber}`).append(scissors);
        } else {
          database
            .ref(`/players/${pNumber}`) // SAVE OPPONENT NAME OTHERWISE
            .once("value")
            .then(function(snapshot) {
              oppName = snapshot.val().name;
            });
        }
      });
  }

  database.ref("/players").on("value", function(snapshot) {
    // WHEN THERE IS A CHANGE IN PLAYERS (NEW OR DISCONNECT)
    $(`.pName`).html(""); // RESET HTML OF ALL PLAYERS
    $(`.pChoice`).html("");
    $(`.pStats`).html("");
    if (snapshot.numChildren() < numPlay) {
      // IF A PLAYER DISCONNECTED
      $(".messageBoard2").append(`${oppName} has disconnected`);
      setTimeout(function() {
        $(".messageBoard2").html("");
      }, 1500);
      numPlay--; // Decrease local count of number of players ////
      database // Reset connected players' wins (because matchup has ended)
        .ref(`/results/${localPlayerNumber}`)
        .child("wins")
        .transaction(function(wins) {
          wins = 0;
          return wins;
        });
      database // Reset connected players' wins
        .ref(`/results/${localPlayerNumber}`)
        .child("wins")
        .transaction(function(losses) {
          losses = 0;
          return losses;
        });
    } else {
      // If it's not a lost player, it's a new one, so add 1 to local count of number of players
      numPlay++;
    }
    snapshot.forEach(child => {
      // Call displayChoices for each player in the game
      displayChoices(child.val().number);
    });
  });

  database.ref("/choices").on("value", function(snapshot) {
    // When number of choices changes
    $(`.pTurn`).html(""); // Reset html of the players' choice

    snapshot.forEach(child => {
      // get which choice is the local players' choice, and display to DOM
      if (child.val().number == localPlayerNumber) {
        $(`.playerChoice-${localPlayerNumber}`).html("");
        $(`.playerChoice-${localPlayerNumber}`).attr("style", "display:none");
        $(`.PlayerTurn-${localPlayerNumber}`).html(
          child.val().choice.toUpperCase()
        );
      }
    });

    if (snapshot.numChildren() == 2) {
      // If both choices have been made, reveal all
      snapshot.forEach(child => {
        //// Display choice
        $(`.playerChoice-${child.val().number}`).html("");
        $(`.playerChoice-${child.val().number}`).attr("style", "display:none");
        $(`.PlayerTurn-${child.val().number}`).html(
          child.val().choice.toUpperCase()
        );
      });
      var winner = compareChoices(snapshot); // Call compareChoices to determine winner given snapshot of choices
      if (winner != 0) {
        // If not a tie
        database
          .ref(`/players/${winner}`)
          .once("value")
          .then(function(snap) {
            var display = snap.val().name;
            $(".result").html(display + " WINS!");
            if (winner == localPlayerNumber) {
              ///// INCREMENT WINS/LOSSES
              database
                .ref(`/results/${localPlayerNumber}`)
                .child("wins")
                .transaction(function(wins) {
                  console.log("WIN HERE");
                  return (wins || 0) + 1;
                });
            } else {
              database
                .ref(`/results/${localPlayerNumber}`)
                .child("losses")
                .transaction(function(losses) {
                  return (losses || 0) + 1;
                });
            }
            reset(snapshot);
          });
      } else {
        database
          .ref(`/players/${winner}`)
          .once("value")
          .then(function() {
            $(".result").html("TIE!");
            reset(snapshot);
          });
      }
    }
  });

  function reset(snapshot) {
    //// RESET GAME
    database.ref(`/choices/${localPlayerNumber}`).remove();
    setTimeout(function() {
      $(".result").html("");
      snapshot.forEach(child => {
        $(`.playerChoice-${child.val().number}`).attr("style", "display:flex");
        $(`.playerTurn-${child.val().number}`).html("");
        displayChoices(child.val().number);
      });
    }, 2000);
  }

  $(".pChoice").on("click", function(event) {
    var choice = $(event.target).attr("value");
    var choiceRef = database.ref(`/choices/${localPlayerNumber}`);
    choiceRef.set({
      choice: choice,
      number: localPlayerNumber
    });
    choiceRef.onDisconnect().remove();
  });

  function compareChoices(snapshot) {
    var choice1;
    var choice2;
    var winner;
    snapshot.forEach(child => {
      if (child.val().number == 1) {
        choice1 = child.val().choice;
      } else {
        choice2 = child.val().choice;
      }
    });
    switch (choice1) {
      case "rock":
        switch (choice2) {
          case "scissors":
            winner = 1;
            break;
          case "paper":
            winner = 2;
            break;
          default:
            winner = 0;
        }
        break;
      case "scissors":
        switch (choice2) {
          case "paper":
            winner = 1;
            break;
          case "rock":
            winner = 2;
            break;
          default:
            winner = 0;
        }
        break;
      case "paper":
        switch (choice2) {
          case "rock":
            winner = 1;
            break;
          case "scissors":
            winner = 2;
            break;
          default:
            winner = 0;
        }
        break;
    }
    return winner;
  }
});
