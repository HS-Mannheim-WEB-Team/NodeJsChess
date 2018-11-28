var http = require('http').createServer(handlehttp);
var io = require('socket.io')(http);
var fs = require('fs');

http.listen(8080);


//load resources
var file_socket_io_js = "<script>\n" + fs.readFileSync(__dirname + '/include/socket.io.js').toString() + "\n</script>";
var file_wrapping = fs.readFileSync(__dirname + '/Chess.html').toString();


//http server
function handlehttp(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});

    res.write(file_wrapping.replace("<chessheader/>", file_socket_io_js));

    res.end();
}

io.on('connection', function (socket) {
    console.log('a user connected');
});
