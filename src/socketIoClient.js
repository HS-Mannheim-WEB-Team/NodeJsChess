$(document).ready(function () {

	//state
	var layoutList = [];
	var currLayoutId = -1;

	//init pre-socket.io
	drawChessfield(createEmptyField());

	//socket.io connection
	const socket = io.connect();
	socket.on('connect', function () {
		console.log("client: connected");
		setStateMessage("connected!", true);
	});
	socket.on('disconnect', function () {
		console.log("client: disconnected");
		setStateMessage("disconnected!", true);
	});

	//layout list
	socket.on('layoutList', function (newLayoutList) {
		setLayoutList(newLayoutList);
	});

	function setLayoutList(newLayoutList) {
		updateChessfield = layoutList.length - 1 === currLayoutId;
		layoutList = newLayoutList;

		//generate html table
		let htmlout = "\n";
		for (let i = 0; i < newLayoutList.length; i++) {
			const layout = newLayoutList[i];
			const fieldColor = i % 2 === 0 ? "layout-list-white" : "layout-list-black";
			htmlout += `<tr><td id="layoutList-${i}" class="${fieldColor}">${layout.notation}</td></tr>\n`
		}
		$("#layoutListContent").html(htmlout);

		//attach click listener
		for (let i = 0; i < newLayoutList.length; i++) {
			$(`#layoutList-${i}`).click(function (event) {
				setChessfield(i);
			});
		}

		if (updateChessfield)
			setChessfield(layoutList.length - 1);
	}

	//chessfield
	function setChessfield(layoutId) {
		currLayoutId = layoutId;
		const layout = layoutList[layoutId];
		drawChessfield(layout.field);

		if (layout.state === undefined) {
			setStateMessage("Game running", false);
		} else {
			setStateMessage(layout.state, true);
		}
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
					htmlout += `<td id="field-id-${y - 1}-${x - 1}" class="${fieldColor} field-inner${cssClassChessField[y - 1][x - 1] ? " " + cssClassChessField[y - 1][x - 1].toString() : ""}"/>`;
				}
			}
			htmlout += "</tr>\n";
		}
		$("#chessfieldContent").html(htmlout);
	}

	function setStateMessage(msg, important) {
		const stateOutput = $("#stateOutput");
		stateOutput.removeClass().addClass(important ? 'stateOutputImportant' : 'stateOutputNormal');
		stateOutput.html(msg);
	}
});

function createEmptyField() {
	return Array.from(Array(8), () => new Array(8));
}
