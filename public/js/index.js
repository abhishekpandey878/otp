var socket = io();

socket.on('connect', function() {
    console.log("connected to the server");

    // socket.emit('createMessage', {
    //     from: "raj",
    //     text: "Hi buddy!"
    // });
});

socket.on('disconnect', function() {
    console.log("disconnected from the server");
});

socket.on('newMessage', function(message) {
    console.log("new message", message);
    var li = jQuery("<li></li>");
    li.text(`${message.from}: ${message.text}  ${message.createdAt}`);

    jQuery("#messages").append(li);
});



$(function() {
    $("#register_button").on("click", function(event) {
      event.preventDefault();
      socket.emit("register", {
        phone_number: $("#phone_number").val()
      });
    });

    $("#verify_button").on("click", function(event) {
      event.preventDefault();
      socket.emit("verify", {
        phone_number: $("#phone_number").val(),
        code: $("#code").val()
      });
    });

    socket.on("code_generated", function(data) {
      $("#register").fadeOut();
      $("#verify").fadeIn();
      $("#update").fadeOut();
      $("#register_instructions").fadeOut();
      $("#verify_instructions").fadeIn();
    });

    socket.on("update", function(data) {
      $("#update").html(data.message);
      $("#update").fadeIn();
    });

    socket.on("reset", function(data) {
      $("#register_instructions").fadeIn();
      $("#verify_instructions").fadeOut();
      $("#update").fadeOut();
      $("#register").fadeIn();
      $("#verify").fadeOut();
    });

    socket.on("verified", function(data) {
      $("#register").fadeOut();
      $("#verify").fadeOut();
      $("#register_instructions").fadeOut();
      $("#verify_instructions").fadeOut();
    });
  });