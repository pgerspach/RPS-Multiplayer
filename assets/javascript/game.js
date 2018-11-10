$(document).ready(function() {
  var wins = 0;
  var losses = 0;
  var numPlay = 0;
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
  const messaging = firebase.messaging();
  messaging.usePublicVapidKey("BCsUf25c3naDkD42FM2osMsSO3ccWhq3exohGCBTBovgjfS7JDI4fL5BHJ1_1INkVY370-Ty3QRLUTv2Ufkhn-M");

  

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
    database
      .ref(`/players/${pNumber}`)
      .once("value")
      .then(function(snapshot) {
        var pName = snapshot.val().name;
        var rock = $("<div>");
        rock.attr("class", "rps");
        rock.attr("value", "rock");
        rock.html("ROCK");

        var paper = $("<div>");
        paper.attr("class", "rps");
        paper.attr("value", "paper");
        paper.html("PAPER");

        var scissors = $("<div>");
        scissors.attr("class", "rps");
        scissors.attr("value", "scissors");
        scissors.html("SCISSORS");

        $(`.playerChoice-${pNumber}`).html("");
        $(`.playerName-${pNumber}`).html(pName);
        var wins=0;
        var losses=0;
        database
      .ref(`/results/${pNumber}`)
      .once("value")
      .then(function(snap) {
        wins = snap.val().wins;
        console.log("WINS: "+snap.val().wins);
        losses=snap.val().losses;
        $(`.playerStats-${pNumber}`).html(`Wins: ${wins} Losses: ${losses}`);

      })

        if (pNumber == localPlayerNumber) {
          $(`.playerChoice-${pNumber}`).append(rock);
          $(`.playerChoice-${pNumber}`).append(paper);
          $(`.playerChoice-${pNumber}`).append(scissors);
        }
      });
  }

  database.ref("/players").on("value", function(snapshot) {
    $(`.pName`).html("");
    $(`.pChoice`).html("");
    $(`.pStats`).html("");
    // if(snapshot.numChildren()<numPlay)
    // {
    //   $(".messageBoard2").append("Your opponent has disconnected");
    //   setTimeout(function(){
    //     $(".messageBoard2").html("");

    //   }, 1500);
    // }
    // else{
    //   numPlay++;
    // }
    snapshot.forEach(child => {
      displayChoices(child.val().number);
    });
    
  });

  database.ref("/choices").on("value", function(snapshot) {
    $(`.pTurn`).html("");

    snapshot.forEach(child => {
      if (child.val().number == localPlayerNumber) {
        $(`.playerChoice-${localPlayerNumber}`).html("");
        $(`.playerChoice-${localPlayerNumber}`).attr("style", "display:none");

        $(`.PlayerTurn-${localPlayerNumber}`).html(
          child.val().choice.toUpperCase()
        );
      }
    });

    if (snapshot.numChildren() == 2) {
      snapshot.forEach(child => {
        $(`.playerChoice-${child.val().number}`).html("");
        $(`.playerChoice-${child.val().number}`).attr("style", "display:none");

        $(`.PlayerTurn-${child.val().number}`).html(
          child.val().choice.toUpperCase()
        );
      });
      var winner = compareChoices(snapshot);
      if (winner != 0) {
        database
          .ref(`/players/${winner}`)
          .once("value")
          .then(function(snap) {

            var display = snap.val().name;
            $(".result").html(display + " WINS!");
            if(winner==localPlayerNumber){ ///// INCREMENT WINS/LOSSES
            database.ref(`/results/${localPlayerNumber}`).child('wins').transaction(function(wins) {
              console.log("WIN HERE");
              return (wins || 0) + 1;
            });
          }
          else{
            database.ref(`/results/${localPlayerNumber}`).child('losses').transaction(function(losses) {
              
              return (losses || 0) + 1;
            });
          }
            reset(snapshot);
          });
      }
      else{
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

  function reset(snapshot){ //// RESET GAME
    database.ref(`/choices/${localPlayerNumber}`).remove();
    setTimeout(function(){
      $(".result").html("");
      snapshot.forEach(child => {
        $(`.playerChoice-${child.val().number}`).attr(
          "style",
          "display:flex"
        );
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
