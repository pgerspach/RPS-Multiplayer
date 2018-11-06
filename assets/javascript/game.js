$(document).ready(function() {
  var config = {
    //apiKey: "AIzaSyBvUs9nIRhm-wmv6Pqwd6kerxL204yA0vA",
    authDomain: "gfb1-16566.firebaseapp.com",
    databaseURL: "https://gfb1-16566.firebaseio.com",
    projectId: "gfb1-16566",
    storageBucket: "gfb1-16566.appspot.com",
    messagingSenderId: "820389293762"
  };

  var playerNumber;

  firebase.initializeApp(config);
  var database = firebase.database();
  var connectionsRef = database.ref("/connections");
  var connectedRef = database.ref(".info/connected");

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

            database.ref("/players/2").set({
              name: playerName,
              number: playerNumber
            });
            var con = database.ref(`/players/${playerNumber}`);
            con.onDisconnect().remove();
            displayChoices(playerNumber);
          } else {
            var playerNumber = 1;

            database.ref("/players/1").set({
              name: playerName,
              number: playerNumber
            });
            var con = database.ref(`/players/${playerNumber}`);
            con.onDisconnect().remove();
            displayChoices(playerNumber);
          }
        }
      } else {
        var playerNumber = 1;

        database.ref("/players/1").set({
          name: playerName,
          number: playerNumber
        });
        var con = database.ref(`/players/${playerNumber}`);
        con.onDisconnect().remove();
        displayChoices(playerNumber);
      }
    });
    $(".messageBoard").html(`Welcome ${playerName}`);
  });

  function displayChoices(pNumber) {
    database
      .ref(`/players/${pNumber}`)
      .once("value")
      .then(function(snapshot) {
        var pName = snapshot.val().name;
        var rock = $("<div>");
        rock.attr("class", "rps");
        rock.html("ROCK");

        var paper = $("<div>");
        paper.attr("class", "rps");
        paper.html("PAPER");

        var scissors = $("<div>");
        scissors.attr("class", "rps");
        scissors.html("SCISSORS");
        $(`.playerChoice-${pNumber}`).html("");

        $(`.playerName-${pNumber}`).html(pName);
        $(`.playerChoice-${pNumber}`).append(rock);
        $(`.playerChoice-${pNumber}`).append(paper);
        $(`.playerChoice-${pNumber}`).append(scissors);
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
});
