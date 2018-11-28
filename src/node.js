var http = require('http').createServer(handlehttp);
var io = require('socket.io')(http);
var fs = require('fs');

http.listen(8080);


//load resources
var file_index = fs.readFileSync(__dirname + '/Chess.html').toString();
file_index = file_index.replace(/<script include="(.+?)"><\/script>/gi, function (match, p1) {
    return "<script>\n" + fs.readFileSync(__dirname + p1).toString() + "\n</script>";
});


//http server
function handlehttp(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});

    res.write(file_index);

    res.end();
}

io.on('connection', function (socket) {
    console.log('a user connected');
});
