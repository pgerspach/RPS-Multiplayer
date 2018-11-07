$(document).ready(function() {
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
    var con = database.ref(`/players/${playerNumber}`);
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

        if (pNumber == localPlayerNumber) {
          $(`.playerChoice-${pNumber}`).append(rock);
          $(`.playerChoice-${pNumber}`).append(paper);
          $(`.playerChoice-${pNumber}`).append(scissors);
        }
      });
  }

  database.ref("/players").on("value", function(snapshot) {
    console.log("SOMEONE BOUNCED");
    $(`.pName`).html("");
    $(`.pChoice`).html("");
    $(`.pStats`).html("");

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
              database.ref(`/choices/${localPlayerNumber}`).remove();
            }, 2000);

            
          });
      }
    }
  });

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
