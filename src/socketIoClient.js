$(document).ready(function () {
	//socket.io connection
	const socket = io.connect();

	socket.on('connect', function () {
		console.log("client: connected");
		$("#result").html("connected!");
	});
	socket.on('disconnect', function () {
		console.log("client: disconnected");
		$("#result").html("disconnected!");
	});

	//move
	$("#submit").click(function () {
		socket.emit('moveRequest', $("#from").val(), $("#to").val());
		return false;
	});
	socket.on('moveResponse', function (message) {
		$("#result").html(message);
	});
});