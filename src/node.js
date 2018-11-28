const http = require('http').createServer(handlehttp);
const io = require('socket.io')(http);
const fs = require('fs');
const request = require('request');
const xml2js = require('xml2js');

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

io.on('connect', function () {
    console.log('a user connected');

    var refreshIntervalId = setInterval(function () {
        request.get(
            'http://www.game-engineering.de:8080/rest/schach/spiel/getAktuelleBelegung/0',
            function (err, response, body) {
                if (err)
                    throw err;
                if (response && (response.statusCode !== 200))
                    throw "statusCode: " + response.statusCode;

                xml2js.parseString(body, function (err, result) {
                    if (err)
                        throw err;

                    const properties = result.propertiesarray.properties;
                    var field = Array.from(Array(8), () => new Array(8));
                    properties.forEach(function (entry) {
                        if (entry.entry.find(function (element) {
                            return element['$'].key === "klasse";
                        })['_'] === "D_Belegung") {
                            return;
                        }

                        const typ = entry.entry.find(function (element) {
                            return element['$'].key === "typ";
                        })['_'];
                        const weiss = entry.entry.find(function (element) {
                            return element['$'].key === "isWeiss";
                        })['_'] === "true";
                        const position = entry.entry.find(function (element) {
                            return element['$'].key === "position";
                        })['_'];

                        if (position) {
                            const x = position.codePointAt(0) - 'a'.codePointAt(0);
                            const y = position.codePointAt(1) - '1'.codePointAt(0);

                            field[y][x] = `figure-${figuresMap[typ]}-${weiss ? "white" : "black"}`;
                        }
                    });
                    io.emit('chessfield', field);
                })
            }
        );
    }, 1000);

    io.on('disconnect', function () {
        console.log('a user disconnected');
        clearInterval(refreshIntervalId);
    });
});

const figuresMap = {
    "Turm": "rook",
    "Springer": "knight",
    "Laeufer": "bishop",
    "Dame": "queen",
    "Koenig": "king",
    "Bauer": "pawn"
};
