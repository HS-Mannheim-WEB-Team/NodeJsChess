$(document).ready(function () {

	//state
	var layoutList = [];
	var currLayoutId = -1;
	var currColor;

	//init pre-socket.io
	setColor(ColorEnum.both);
	setLayoutList([{
		notation: "connecting...",
		state: "connecting...",
		field: createEmptyField()
	}]);

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
		$("#layout-list-content").html(htmlout);

		//attach click listener
		for (let i = 0; i < newLayoutList.length; i++) {
			$(`#layoutList-${i}`).click(function () {
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
		setStateColor(layoutId % 2 === 0 ? ColorEnum.white : ColorEnum.black);
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
		$("#chessfield-content").html(htmlout);
	}

	//stateMessage
	function setStateMessage(msg, important) {
		const stateOutput = $("#state-output");
		stateOutput.removeClass().addClass(important ? 'state-output-important' : 'state-output-normal');
		stateOutput.html(msg);
	}

	function setStateColor(color) {
		const stateColor = $("#state-color").removeClass();
		if (color === ColorEnum.white) {
			stateColor.addClass("state-color-white").html("White's turn");
		} else if (color === ColorEnum.black) {
			stateColor.addClass("state-color-black").html("Black's turn");
		} else {
			throw new Error("Invalid color!");
		}
	}

	//settings
	$("#new-game").click(function () {
		socket.emit('newGame');
	});
	$("#setting-color-white").click(function () {
		setColor(ColorEnum.white);
	});
	$("#setting-color-black").click(function () {
		setColor(ColorEnum.black);
	});
	$("#setting-color-both").click(function () {
		setColor(ColorEnum.both);
	});
	
	function setColor(newColor) {
		currColor = newColor;
		$("#setting-color-white").removeClass().addClass(newColor === ColorEnum.white ? "setting-color-selected" : "setting-color-unselected");
		$("#setting-color-black").removeClass().addClass(newColor === ColorEnum.black ? "setting-color-selected" : "setting-color-unselected");
		$("#setting-color-both").removeClass().addClass(newColor === ColorEnum.both ? "setting-color-selected" : "setting-color-unselected");
	}
});

function createEmptyField() {
	return Array.from(Array(8), () => new Array(8));
}

const ColorEnum = {
	white: "white",
	black: "black",
	both: "both"
};
