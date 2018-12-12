//Imports
const http = require('http').createServer(handlehttp);
const io = require('socket.io')(http);
const fs = require('fs');
const request = require('request');
const xml2js = require('xml2js');

//Start http Server
http.listen(8080);

//embedder
function loadLocalFile(name) {
	return fs.readFileSync(__dirname + "/" + name);
}

function embedfile(file) {
	const content = loadLocalFile(file).toString();
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

//xml parsing utils
function httpGet(url, func) {
	request.get(url, function (err, response, body) {
		if (err)
			throw err;
		if (response && (response.statusCode !== 200))
			throw "statusCode: " + response.statusCode;

		func(response, body);
	});
}

function forEachXmlEntry(body, func) {
	xml2js.parseString(body, function (err, result) {
		if (err)
			throw err;

		if (result.propertiesarray) {
			//multi entry
			result.propertiesarray.properties.forEach(function (entry) {
				func(entry.entry);
			});
		} else {
			//single entry
			func(result.properties.entry);
		}
	});
}

function findEntry(entry, key) {
	return entry.find(function (element) {
		return element['$'].key === key;
	})['_'];
}

//socket.io server side
io.on('connection', function (socket) {
	console.log('a user connected');

	socket.on('disconnect', function () {
		console.log('a user disconnected');
	});

	socket.on('moveRequest', function (from, to) {
		if (!from || !to) {
			socket.emit('moveResponse', "Input parameters empty!");
			return;
		}

		let meldung;
		httpGet("http://www.game-engineering.de:8080/rest/schach/spiel/ziehe/0/" + from + "/" + to, function (request, body) {
			forEachXmlEntry(body, function (property) {
				const klasse = findEntry(property, "klasse");
				if (!(klasse === "D_OK" || klasse === "D_Fehler")) {
					return;
				}

				meldung = findEntry(property, "meldung");
			});
			socket.emit('moveResponse', meldung ? meldung : "D_Fehler without message");
		});
	})
});
