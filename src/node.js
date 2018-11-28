var http = require('http').createServer(handlehttp);
var io = require('socket.io')(http);
var fs = require('fs');

http.listen(8080);

function loadLocalFile(name) {
    return fs.readFileSync(__dirname + "/" + name);
}

function embedfile(file) {
    var content = loadLocalFile(file).toString();
    if (file.endsWith(".html")) {
        return embedhtml(content);
    } else if (file.endsWith(".css")) {
        return embedcss(content);
    }
    return content;
}

function embedhtml(content) {
    //embed script
    content = content.replace(/<script[^>]*embed="([^"]+?)"[^>]*(?:\/\s*>|>\s*<\/script>)/gis, function (match, p1) {
        return "<script>\n" + embedfile(p1).toString() + "\n</script>";
    });

    //embed style
    content = content.replace(/<style[^>]*(!?embed=)>(.+?)<\/style>/gis, function (match, p1) {
        return "<style>\n" + embedcss(p1) + "\n</style>";
    });
    content = content.replace(/<style[^>]*embed="([^"]+?)"[^>]*(?:\/\s*>|>\s*<\/style>)/gis, function (match, p1) {
        return "<style>\n" + embedfile(p1).toString() + "\n</style>";
    });
    return content;
}

function embedcss(content) {
    content = content.replace(/background-image:\s*url\("([^;]+)"\);/gis, function (match, p1) {
        return "background-image: url(\"data:image/png;base64," + loadLocalFile(p1).toString("base64") + "\");";
    });
    return content;
}


//http server
const file_index = embedfile("Chess.html");

function handlehttp(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(file_index);
}

io.on('connection', function () {
    console.log('a user connected');
    io.emit('chessfield',
        [
            ["0", "0", "figure-king-white", "0", "0", "0", "0", "0"],
            ["0", "0", "0", "0", "0", "0", "0", "0"],
            ["0", "0", "0", "0", "0", "0", "0", "0"],
            ["0", "0", "0", "0", "0", "0", "0", "0"],
            ["0", "0", "0", "0", "0", "0", "0", "0"],
            ["0", "0", "0", "0", "0", "0", "0", "0"],
            ["0", "0", "0", "0", "0", "0", "0", "0"],
            ["0", "0", "0", "0", "0", "0", "0", "0"],
        ]);
});
