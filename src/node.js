var http = require('http');
var fs = require('fs');


//utility functions


//load resources
console.log("loading resources...");

var wrapping;
fs.readFile(__dirname + '/Wrapping.html', function (err, data) {
    if (err) {
        throw err;
    }
    wrapping = data;
});

console.log("resources loaded!");


//start http server
console.log("starting http server...");

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});

    res.write(wrapping);

    res.end();
}).listen(8080);

console.log("http server started!");
