var WALL = 'WALL';
var FLOOR = 'FLOOR';
var BALL = 'BALL';
var GAMER = 'GAMER';
var SLIME = 'SLIME'
var GLUED = 'GLUED'

var GAMER_IMG = '<img src="img/gamer.png">';
var BALL_IMG = '<img src="img/ball.png">';
var SLIME_IMG = '<img src ="img/slime.png">';
var GLUED_IMG = '<img src = "img/gamer-purple.png">';

var gBoard;
var gGamerPos;
var gCollectedBalls = 0;
var gBallsCount = 2;
var collectSound = new Audio("sounds/collected.wav");
var gBallsInterval;
var gSlimeInterval;
var gFirstMove = 1;
var gMovesCount = 0;
var gIsStuck = false;

var restart = document.querySelector('.restart');

function show(elem) {
	elem.style.display = 'block';
};


function initGame() {
	gGamerPos = { i: 2, j: 9 };
	gBoard = buildBoard();
	renderBoard(gBoard);

}
// Restart Pressed
function restart() {
	gGamerPos = { i: 2, j: 9 };
	gBoard = buildBoard();
	renderBoard(gBoard);
}

function freeze() {

}

function addRndSlime() {
	var board = gBoard;
	var i = getRandomInt(1, board.length - 1);
	var j = getRandomInt(1, board[0].length - 1);
	var targetCell = board[i][j].gameElement;
	if (targetCell === null) {
		renderCell({ i: i, j: j }, SLIME_IMG);
		board[i][j].gameElement = SLIME;
		setTimeout(function () {
			if (board[i][j].gameElement !== GAMER) {
				board[i][j].gameElement = null;
				renderCell({ i: i, j: j }, '');
			}
		}, 3000);
	}
}

function addRndBall() {
	var board = gBoard;
	var i = getRandomInt(1, board.length - 1);
	var j = getRandomInt(1, board[0].length - 1);
	var targetCell = board[i][j].gameElement;
	if (targetCell === null) {
		gBallsCount++;
		renderCell({ i: i, j: j }, BALL_IMG);
		return board[i][j].gameElement = BALL;
	}
}

function isVictory() {
	if (gCollectedBalls === gBallsCount) {
		console.log("Victory!");
		clearInterval(gBallsInterval);
		clearInterval(gSlimeInterval);
		gBallsCount++;
		show(restart);
	}
}

function buildBoard() {
	// Create the Matrix
	var board = new Array(10);
	for (var i = 0; i < board.length; i++) {
		board[i] = new Array(12);
	}

	// Put FLOOR everywhere and WALL at edges, add FLOOR portals
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[0].length; j++) {
			var cell = { type: FLOOR, gameElement: null };
			// Place Walls at edges
			if (i === 0 || i === board.length - 1 || j === 0 || j === board[0].length - 1) {
				cell.type = WALL;
			}
			if (i === 0 && j === 6 || i === 9 && j === 6 || i === 5 && j === 0 || i === 5 && j === 11) {
				cell.type = FLOOR;
			}
			board[i][j] = cell;
		}
	}
	// Place the gamer
	board[gGamerPos.i][gGamerPos.j].gameElement = GAMER;

	// Place the Balls
	board[3][8].gameElement = BALL;
	board[7][4].gameElement = BALL;

	console.log(board);
	return board;
}

// Render the board to an HTML table
function renderBoard(board) {

	var elBoard = document.querySelector('.board');
	var strHTML = '';
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>\n';
		for (var j = 0; j < board[0].length; j++) {
			var currCell = board[i][j];

			var cellClass = getClassName({ i: i, j: j })

			if (currCell.type === FLOOR) cellClass += ' floor';
			else if (currCell.type === WALL) cellClass += ' wall';

			strHTML += '\t<td class="cell ' + cellClass +
				'"  onclick="moveTo(' + i + ',' + j + ')" >\n';

			if (currCell.gameElement === GAMER) {
				strHTML += GAMER_IMG;
			} else if (currCell.gameElement === BALL) {
				strHTML += BALL_IMG;
			} else if (currCell.gameElement === SLIME) {
				strHTML += SLIME_IMG;
			} else if (currCell.gameElement === GLUED) {
				strHTML += GLUED_IMG;
			}

			strHTML += '\t</td>\n';
		}
		strHTML += '</tr>\n';
	}
	// console.log('strHTML is:');
	console.log(strHTML);
	elBoard.innerHTML = strHTML;
}

// Move the player to a specific location
function moveTo(i, j) {
	var targetCell = gBoard[i][j];
	if (targetCell.type === WALL) return;


	// Calculate distance to make sure we are moving to a neighbor cell
	var iAbsDiff = Math.abs(i - gGamerPos.i);
	var jAbsDiff = Math.abs(j - gGamerPos.j);

	// If the clicked Cell is one of the four allowed
	if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0) || (iAbsDiff === 9 && jAbsDiff === 0) || (iAbsDiff === 0 && jAbsDiff === 11)) {
		gMovesCount++
		if (gMovesCount === gFirstMove) {
			gBallsInterval = setInterval(addRndBall, 3000);
			gSlimeInterval = setInterval(addRndSlime, 5000);
			
		}
		if (targetCell.gameElement === SLIME) {
			gIsStuck = true;
			console.log('Oh no...');
			setTimeout(function () {
				gIsStuck = false;
			}, 3000)
			return;
		}

		if (targetCell.gameElement === BALL) {
			collectSound.play();
			gCollectedBalls++;
			elBallsCount = document.querySelector('span');
			elBallsCount.innerText = gCollectedBalls;
			isVictory();
		}

		// MOVING
		// Model:
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = null;
		// Dom:
		renderCell(gGamerPos, '');

		// Model:
		gGamerPos.i = i;
		gGamerPos.j = j;
		gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER;
		// DOM:
		renderCell(gGamerPos, GAMER_IMG);

	} // else console.log('TOO FAR', iAbsDiff, jAbsDiff);

}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
	var cellSelector = '.' + getClassName(location)
	var elCell = document.querySelector(cellSelector);
	elCell.innerHTML = value;
}

// Move the player by keyboard arrows
function handleKey(event) {

	var i = gGamerPos.i;
	var j = gGamerPos.j;



	switch (event.key) {
		case 'ArrowLeft':
			if ((i === 5 && j === 0)) moveTo(5, 11);
			else moveTo(i, j - 1);
			break;
		case 'ArrowRight':
			if ((i === 5 && j === 11)) moveTo(5, 0);
			else moveTo(i, j + 1);
			break;
		case 'ArrowUp':
			if ((i === 0 && j === 6)) moveTo(9, 6);
			else moveTo(i - 1, j);
			break;
		case 'ArrowDown':
			if ((i === 9 && j === 6)) moveTo(0, 6);
			else moveTo(i + 1, j);
			break;

	}

}

// Show balls collected


// Returns the class name for a specific cell
function getClassName(location) {
	var cellClass = 'cell-' + location.i + '-' + location.j;
	return cellClass;
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}