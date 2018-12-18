//Imports
const http = require('http').createServer(handlehttp);
const io = require('socket.io')(http);
const fs = require('fs');
const request = require('request-promise');
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
function forEachXmlProperty(body, func) {
	xml2js.parseString(body, function (err, result) {
		if (err)
			throw err;

		if (result.propertiesarray) {
			//multi entry
			result.propertiesarray.properties.forEach(function (entry) {
				func(xmlPropertyToObject(entry.entry));
			});
		} else {
			//single entry
			func(xmlPropertyToObject(result.properties.entry));
		}
	});
}

function xmlPropertyToObject(xmlProperty) {
	let property = {};
	xmlProperty.forEach(function (entry) {
		property[entry['$'].key] = entry['_'];
	});
	return property;
}

//other utils
function createEmptyField() {
	return Array.from(Array(8), () => new Array(8));
}

//socket.io server side
io.on('connection', function (socket) {
	console.log('a user connected');

	//state
	const id = 15;
	let prevLayoutCount = -1;

	//update query
	update();
	const refreshIntervalId = setInterval(update, 1000);
	//disconnect -> stop queries
	socket.on('disconnect', function () {
		console.log('a user disconnected');
		clearInterval(refreshIntervalId);
	});

	function update() {
		Promise.all([
			request('http://www.game-engineering.de:8080/rest/schach/spiel/getSpielDaten/' + id)
				.then(function (body) {
					let layoutCnt;
					forEachXmlProperty(body, function (property) {
						if (property.klasse !== "D_Spiel") {
							return;
						}

						layoutCnt = property.anzahlZuege;
					});
					return layoutCnt;
				}),
			request('http://www.game-engineering.de:8080/rest/schach/spiel/getZugHistorie/' + id)
				.then(function (body) {
					let notationList = ['initial'];
					forEachXmlProperty(body, function (property) {
						if (property.klasse !== "D_ZugHistorie") {
							return;
						}
						notationList.push(property.zug);
					});
					return notationList;
				})
		]).then(function (result) {
			layoutCnt = result[0];
			notationList = result[1];

			if (layoutCnt === prevLayoutCount)
				return;
			prevLayoutCount = layoutCnt;

			let layoutListPromise = [];
			for (let i = 0; i <= layoutCnt; i++) {
				layoutListPromise[i] = request(`http://www.game-engineering.de:8080/rest/schach/spiel/getBelegung/${id}/${i}`)
					.then(function (body) {
						let field = createEmptyField();
						forEachXmlProperty(body, function (property) {
							if (property.klasse !== "D_Figur") {
								return;
							}

							if (property.position) {
								const x = property.position.codePointAt(0) - 'a'.codePointAt(0);
								const y = property.position.codePointAt(1) - '1'.codePointAt(0);

								field[y][x] = `figure-${figuresMap[property.typ]}-${property.isWeiss === 'true' ? "white" : "black"}`;
							}
						});
						return {
							notation: `${i}: ${notationList[i]}`,
							field: field
						};
					});
			}

			Promise.all(layoutListPromise).then(function (layoutList) {
				socket.emit('layoutList', layoutList);
			});
		});
	}

	//move
	socket.on('possibleMoveRequest', function (y, x) {
		request(`http://www.game-engineering.de:8080/rest/schach/spiel/getErlaubteZuege/${id}/${String.fromCodePoint(x + 'a'.codePointAt(0))}${String.fromCodePoint(y + '1'.codePointAt(0))}`)
			.then(function (body) {
				let field = createEmptyField();
				forEachXmlProperty(body, function (property) {
					if (property.klasse !== "D_Zug") {
						return
					}

					const x = property.nach.codePointAt(0) - 'a'.codePointAt(0);
					const y = property.nach.codePointAt(1) - '1'.codePointAt(0);
					field[y][x] = 'field-marked';
				});
				socket.emit('possibleMoveResponse', field);
			});
	});

	socket.on('makeMoveRequest', function (von, nach) {
		const url = `http://www.game-engineering.de:8080/rest/schach/spiel/ziehe/${id}/${von}/${nach}`;
		console.log(url);
		request(url)
			.then(function (body) {
				console.log(body)
			});
	})
});

const figuresMap = {
	"Turm": "rook",
	"Springer": "knight",
	"Laeufer": "bishop",
	"Dame": "queen",
	"Koenig": "king",
	"Bauer": "pawn"
};
