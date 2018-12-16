$(document).ready(function () {
	//socket.io connection
	const socket = io.connect();

	socket.on('connect', function () {
		console.log("client: connected");
	});
	socket.on('disconnect', function () {
		console.log("client: disconnected");
	});

	//rebuild chessfield
	socket.on('layoutList', function (layoutList) {
		drawChessfield(layoutList[layoutList.length - 1]);
	});
});

function drawChessfield(cssClassChessField) {
	let htmlout = "\n";
	for (let y = 0; y < 10; y++) {
		htmlout += "<tr>";
		for (let x = 0; x < 10; x++) {
			const fieldBlack = (x + y) % 2 === 0 ? "field-black" : "field-white";
			const borderLetter = x === 0 || x === 9;
			const borderNumber = y === 0 || y === 9;
			if (borderLetter && borderNumber) {
				htmlout += `<td class="${fieldBlack} field-border"/>`;
			} else if (borderLetter) {
				htmlout += `<td class="${fieldBlack} field-border">${String.fromCharCode('8'.charCodeAt(0) - y + 1)}</td>`;
			} else if (borderNumber) {
				htmlout += `<td class="${fieldBlack} field-border">${String.fromCharCode('A'.charCodeAt(0) + x - 1)}</td>`;
			} else {
				htmlout += `<td id="field-id-${y}-${x}" class="${fieldBlack} field-inner${cssClassChessField[y - 1][x - 1] ? " " + cssClassChessField[y - 1][x - 1].toString() : ""}"/>`;
			}
		}
		htmlout += "</tr>\n";
	}
	$("#chessfield").html(htmlout);
}