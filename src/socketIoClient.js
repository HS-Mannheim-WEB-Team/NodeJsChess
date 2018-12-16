var layoutList = [];
var currLayoutId = -1;

$(document).ready(function () {
	setLayoutList([{
		notation: "initial",
		field: createEmptyField()
	}]);

	//socket.io connection
	const socket = io.connect();

	socket.on('connect', function () {
		console.log("client: connected");
	});
	socket.on('disconnect', function () {
		console.log("client: disconnected");
	});

	//rebuild chessfield
	socket.on('layoutList', function (newLayoutList) {
		setLayoutList(newLayoutList);
	});
});

function createEmptyField() {
	return Array.from(Array(8), () => new Array(8));
}

function setLayoutList(newLayoutList) {
	updateChessfield = layoutList.length - 1 === currLayoutId;
	layoutList = newLayoutList;
	if (updateChessfield)
		setChessfield(layoutList.length - 1);

	//generate html table
	let htmlout = "\n";
	for (let i = 0; i < newLayoutList.length; i++) {
		const layout = newLayoutList[i];
		const fieldColor = i % 2 === 0 ? "layout-list-white" : "layout-list-black";
		htmlout += `<tr><td id="layoutList-${i}" class="${fieldColor}">${layout.notation}</td></tr>\n`
	}
	$("#layoutList").html(htmlout);

	//attach click listener
	for (let i = 0; i < newLayoutList.length; i++) {
		$(`#layoutList-${i}`).click(function (event) {
			setChessfield(i);
		});
	}
}

function setChessfield(layoutId) {
	currLayoutId = layoutId;
	drawChessfield(layoutList[layoutId].field);
}

function drawChessfield(cssClassChessField) {
	let htmlout = "\n";
	for (let y = 0; y < 10; y++) {
		htmlout += "<tr>";
		for (let x = 0; x < 10; x++) {
			const fieldColor = (x + y) % 2 === 0 ? "field-white" : "field-black";
			const borderLetter = x === 0 || x === 9;
			const borderNumber = y === 0 || y === 9;
			if (borderLetter && borderNumber) {
				htmlout += `<td class="${fieldColor} field-border"/>`;
			} else if (borderLetter) {
				htmlout += `<td class="${fieldColor} field-border">${String.fromCharCode('8'.charCodeAt(0) - y + 1)}</td>`;
			} else if (borderNumber) {
				htmlout += `<td class="${fieldColor} field-border">${String.fromCharCode('A'.charCodeAt(0) + x - 1)}</td>`;
			} else {
				htmlout += `<td id="field-id-${y}-${x}" class="${fieldColor} field-inner${cssClassChessField[y - 1][x - 1] ? " " + cssClassChessField[y - 1][x - 1].toString() : ""}"/>`;
			}
		}
		htmlout += "</tr>\n";
	}
	$("#chessfield").html(htmlout);
}