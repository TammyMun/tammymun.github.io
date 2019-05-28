'use-strict';

var gBoard;
var gLevel = { BEGINNER: { SIZE: 4, MINES: 2 }, MEDIUM: { SIZE: 8, MINES: 12 }, EXPERT: { SIZE: 12, MINES: 30 } };
var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, clicksCount: 0, lives: 3, hints: 3 };
var MINE_IMG = '<img src="img/mine.png">';
var gStartCell;
var gTimeInterval;
var gCurrLevel = gLevel.MEDIUM;
var elClock = document.querySelector('.clock');
var gLives = '<div><img src="img/heart.png"></div>';
var elLives = document.querySelector('.lives');
var smiley = document.querySelector('#smiley');
var gMark = '<img src="img/mark.png">';
var gElement = '<img src="img/gem.png">';
var gIsProcessing = false; // a variable to prevent clicking too fast on a mine twice or on the revealed hint
var gHints = [];
var HINT_IMG = '<img src="img/hint.png">';
var elHints = document.querySelector('.hints');

function initGame() {
    gBoard = buildBoard(gCurrLevel);
    renderBoard(gBoard);
    renderLives();
    renderHints();
    renderScores();
    smiley.innerHTML = `<img src="img/normal.png">`;
}

function levelClicked(elButton) {
    if (elButton.classList.contains('lvl1')) { gCurrLevel = gLevel.BEGINNER; }
    else if (elButton.classList.contains('lvl2')) { gCurrLevel = gLevel.MEDIUM; }
    else if (elButton.classList.contains('lvl3')) { gCurrLevel = gLevel.EXPERT; }
    return restart();
}

function restart() {
    resetGlobalVars();
    gBoard = buildBoard(gCurrLevel);
    renderBoard(gBoard);
    hide('modalwin');
    hide('modalfail');
    hide('restart');
}

function resetGlobalVars() {
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, clicksCount: 0, lives: 3, hints: 3 };
    gStartCell = null;
    clearInterval(gTimeInterval);
    elClock.innerText = `TIME: 0`;
    renderLives();
    renderHints();
    renderScores();
    gHints = [];
    smiley.innerHTML = `<img src="img/normal.png">`;
}

function buildBoard(level) {
    var board = new Array(level.SIZE);
    for (var i = 0; i < board.length; i++) {
        board[i] = new Array(level.SIZE);
    }

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var cell = {
                element: gElement,
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
            }
            board[i][j] = cell;
        }
    }
    return board;
}

function minesAndNegs() {

    for (var i = 0; i < gCurrLevel.MINES; i++) {
        setRndMines();
    }
    setMinesNegsCount(gBoard);
    setHints();
}

function setRndMines() {
    var board = gBoard;
    var i = getRandomInt(1, board.length);
    var j = getRandomInt(1, board[0].length);
    if (board[i][j].isMine === true || board[i][j] === gStartCell) setRndMines(); // a recursion so it doesn't repeat the same spot and doesn't put it in the first clicked cell.
    else board[i][j].isMine = true;
}


function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var count = 0;
            if (i - 1 > -1 && j - 1 > -1 && board[i - 1][j - 1].isMine === true) count++;
            if (i - 1 > -1 && board[i - 1][j].isMine === true) count++;
            if (i + 1 < board.length && j - 1 > -1 && board[i + 1][j - 1].isMine === true) count++;
            if (j - 1 > -1 && board[i][j - 1].isMine === true) count++;
            if (i - 1 > -1 && j + 1 < board.length && board[i - 1][j + 1].isMine === true) count++;
            if (i + 1 < board.length && j + 1 < board.length && board[i + 1][j + 1].isMine === true) count++;
            if (j + 1 < board.length && board[i][j + 1].isMine === true) count++;
            if (i + 1 < board.length && board[i + 1][j].isMine === true) count++;
            board[i][j].minesAroundCount = (count);
        }
    }
    return board;
}

function getAllMines() {
    var board = gBoard;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine) {
                renderCell({ i: i, j: j }, MINE_IMG);
                var cellSelector = getCellId({ i: i, j: j })
                var elCell = document.querySelector('#' + cellSelector);
                elCell.classList.remove('hide');
                elCell.classList.add('mine');
            }
        }
    }
}

function renderBoard(board) {
    var strHtml = '';
    for (var i = 0; i < board.length; i++) {
        var row = board[i];
        strHtml += '<tr>';
        for (var j = 0; j < row.length; j++) {
            var cell = row[j];

            var tdId = `cell-${i}-${j}`;

            strHtml += `<td id="${tdId}" class="cell hide" oncontextmenu="cellMarked(this, ${i}, ${j})" onclick="cellClicked(this, ${i}, ${j})">
                            ${cell.element}
                        </td>`
        }
        strHtml += '</tr>';
    }
    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHtml;
}

function cellClicked(elCell, i, j) {
    var currCell = gBoard[i][j];
    if (gIsProcessing === true) return;
    if (elCell.classList.contains('hint')) {
        hintNegs(gBoard, elCell, i, j);
        gIsProcessing = true;
        setTimeout(function () { gIsProcessing = false }, 500);
        return;
    }
    if (gGame.clicksCount === 0) {
        showRestart('restart');
        currCell.isShown = true;
        gGame.isOn = true;
        gTimeInterval = setInterval(function () { gGame.secsPassed++; elClock.innerText = `TIME: ${gGame.secsPassed}` }, 1000);
        gStartCell = currCell;
        gGame.shownCount++;
        elCell.classList.remove('hide');
        elCell.classList.add('safe');
        minesAndNegs();
        renderCell({ i: i, j: j }, currCell.minesAroundCount);
        gGame.clicksCount++;
    }
    if (currCell.isMine) {
        if (elCell.classList.contains('mark')) return; // marked cells can't be clicked to reveal. 
        gGame.isOn = false;
        elCell.classList.remove('hide');
        elCell.classList.add('mine');
        renderCell({ i: i, j: j }, MINE_IMG);
        gGame.lives--;
        renderLives();
        if (gGame.lives === 0) {
            getAllMines();
            clearInterval(gTimeInterval);
            show('modalfail');
            smiley.innerHTML = `<img src="img/dead.png">`;
            // hide('restart');
        } else {
            gIsProcessing = true;
            setTimeout(function () {
                elCell.classList.remove('mine');
                elCell.classList.add('hide');
                renderCell({ i: i, j: j }, gBoard[i][j].element)
                gIsProcessing = false;
            }, 1500);
            // Shows the first and second mine after a life is lost, and doesn't let you click on it again for the time it shows.
        }
    } else {
        if (elCell.classList.contains('mark')) return;
        if (currCell.isShown === false) {
            currCell.isShown = true;
            gGame.shownCount++;
        }
        elCell.classList.remove('hide');
        elCell.classList.add('safe');
        renderCell({ i: i, j: j }, currCell.minesAroundCount);
        checkGameOver();
        if (currCell.minesAroundCount === 0) {
            expandShown(gBoard, elCell, i, j);
            checkGameOver();
        }
    }
}

function cellMarked(elCell, i, j) {
    if (gIsProcessing === true || gBoard[i][j].isShown === true) return;

    if (gGame.clicksCount === 0) {
        minesAndNegs();
        gGame.isOn = true;
        console.log(gGame.isOn);
        renderCell({ i: i, j: j }, gMark);
        gTimeInterval = setInterval(function () { gGame.secsPassed++; elClock.innerText = `TIME: ${gGame.secsPassed}` }, 1000);
        gGame.clicksCount++;
        elCell.classList.add('mark');
        gBoard[i][j].isMarked = true;
        gGame.markedCount++;
    } else if (elCell.classList.contains('mark')) {
        renderCell({ i: i, j: j }, gBoard[i][j].element);
        gGame.markedCount--;
        elCell.classList.remove('mark');
        gBoard[i][j].isMarked = false;
    } else {
        gBoard[i][j].isMarked = true;
        renderCell({ i: i, j: j }, gMark);
        gGame.markedCount++;
        elCell.classList.add('mark');
        checkGameOver();
    }
}

function renderCell(location, value) {
    var cellSelector = getCellId(location)
    var elCell = document.querySelector('#' + cellSelector);
    elCell.innerHTML = value;
}

function getCellId(location) {
    var cellId = 'cell-' + location.i + '-' + location.j;
    return cellId;
}

function checkGameOver() {
    if (gCurrLevel.SIZE ** 2 - gCurrLevel.MINES === gGame.shownCount && gCurrLevel.MINES === gGame.markedCount) {
        clearInterval(gTimeInterval);  
        smiley.innerHTML = `<img src="img/win.png">`;
        var currScore = gGame.secsPassed;
        if (gCurrLevel === gLevel.BEGINNER) {
            var lvl1Best = localStorage.getItem('beginnerTime');
            if (currScore < lvl1Best || lvl1Best === null) {
                lvl1Best = currScore;
                localStorage.setItem('beginnerTime', lvl1Best);
                show('modalscore');
            } else {
                show('modalwin');
            }
        } else if (gCurrLevel === gLevel.MEDIUM) {
            var lvl2Best = localStorage.getItem('mediumTime');
            if (currScore < lvl2Best || lvl2Best === null) {
                lvl2Best = currScore;
                localStorage.setItem('mediumTime', lvl2Best);
                show('modalscore');
            } else {
                show('modalwin');
            }
        } else if (gCurrLevel === gLevel.EXPERT) {
            var lvl3Best = localStorage.getItem('expertTime');
            if (currScore < lvl3Best || lvl3Best === null) {
                lvl3Best = currScore;
                localStorage.setItem('expertTime', lvl3Best);
                show('modalscore');
            } else {
                show('modalwin');
            }
        }
    }
}

// Checks the neighbors, if it isn't a mine, it expands and shown.

function expandShown(board, elCell, x, y) {
    for (var i = x - 2; i <= x + 2; i++) {
        for (var j = y - 2; j <= y + 2; j++) {
            if (i < 0 || j < 0 || i >= board.length || j >= board.length) continue;
            var cell = board[i][j];
            if (cell.isMine === false) {
                var cellSelector = getCellId({ i: i, j: j })
                elCell = document.querySelector('#' + cellSelector);
                if (elCell.classList.contains('mark')) continue;
                elCell.classList.remove('hide');
                elCell.classList.add('safe');
                renderCell({ i: i, j: j }, cell.minesAroundCount);
                if (cell.isShown === false) {
                    cell.isShown = true;
                    gGame.shownCount++;
                }
                // if (cell.minesAroundCount === 0) {expandShown(board, elCell, i, j)}; // Couldn't figure the bigger expansion in the end.
            }
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
}

// toggle visibility of button or modal to hide the element
function hide(id) {
    var e = document.getElementById(id);
    e.style.display = 'none';
}

// toggle visibility of button or modal to show the element
function show(id) {
    var e = document.getElementById(id);
    e.style.display = 'block';
}

function showRestart(id) {
    var e = document.getElementById(id);
    e.style.display = 'inline-flex';
}

function renderLives() {
    elLives.innerHTML = `LIVES: ${gLives.repeat(gGame.lives)}`;
}

function renderHints() {
    elHints.innerHTML = `HINTS: ${HINT_IMG.repeat(gGame.hints)}`;
}

function setHints() {
    var safes = getAllSafes();
    gHints= safes.slice(0, 3);
}

function getAllSafes() {
    var safeArray = [];
    var board = gBoard;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (!board[i][j].isMine && board[i][j].isShown === false) {
                var cellSelector = getCellId({ i: i, j: j })
                safeArray.push(cellSelector);
            }
        }
    }
    var shuffledSafes = shuffle(safeArray);
    return shuffledSafes;
}

function giveHint() {
    if (gGame.clicksCount === 0) return; // can only get a hint after you started to expose or flag a cell.
    if (gIsProcessing) return;
    gIsProcessing = true;
    setTimeout(function () { gIsProcessing = false }, 200);
    var elHint = document.querySelector('#' + gHints[gGame.hints-1]);

    elHint.classList.add('hint');
    setTimeout(function () { elHint.classList.remove('hint'); }, 3000);
    gGame.hints--;
    renderHints();

}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function hintNegs(board, elCell, x, y) {
    var currCell = board[x][y];
    for (var i = x - 1; i <= x + 1; i++) {
        for (var j = y - 1; j <= y + 1; j++) {
            if (i < 0 || j < 0 || i >= board.length || j >= board.length) continue;
            var cell = board[i][j];
            var cellSelector = getCellId({ i: i, j: j })
            var elNegCell = document.querySelector('#' + cellSelector);
            if (cell.isMarked === true) continue;
            elNegCell.classList.remove('hide');
            elNegCell.classList.add('safe');
            if (cell.isMine === true) {
                renderCell({ i: i, j: j }, 'M');
            } else {
                renderCell({ i: i, j: j }, cell.minesAroundCount);
            }
        }
    }
    setTimeout(function () {
        for (var i = x - 1; i <= x + 1; i++) {
            for (var j = y - 1; j <= y + 1; j++) {
                if (i < 0 || j < 0 || i >= board.length || j >= board.length) continue;
                var cell = board[i][j];
                if (cell.isShown === true || cell.isMarked === true) continue;
                var cellSelector = getCellId({ i: i, j: j })
                var elNegCell = document.querySelector('#' + cellSelector);
                elNegCell.classList.add('hide');
                elNegCell.classList.remove('safe');
                renderCell({ i: i, j: j }, cell.element);
            }
        }
    }, 1000);
    if (currCell.isShown === true) return;
    setTimeout(function () {
        renderCell({ i: x, j: y }, currCell.element);
        elCell.classList.remove('safe');
        elCell.classList.add('hide');
    }, 1000);
}

function savePrintUser() {
    hide('modalscore');
    if (gCurrLevel === gLevel.BEGINNER) {
        var begWinnerName = document.getElementById('best-score').value;
        localStorage.setItem('begName', begWinnerName);
        document.querySelector("#beginner").innerHTML = `${begWinnerName} with ${localStorage.getItem('beginnerTime')} seconds`;
    }
    else if (gCurrLevel === gLevel.MEDIUM) {
        var medWinnerName = document.getElementById('best-score').value;
        localStorage.setItem('medName', medWinnerName);
        document.querySelector('#medium').innerHTML = `${medWinnerName} with ${localStorage.getItem('mediumTime')} seconds`;
    }
    else if (gCurrLevel === gLevel.EXPERT) {
        var expWinnerName = document.getElementById('best-score').value;
        localStorage.setItem('expName', expWinnerName);
        document.querySelector('#expert').innerHTML = `${expWinnerName} with ${localStorage.getItem('expertTime')} seconds`;
    } else return;
}

function renderScores() {
    document.querySelector('#beginner').innerHTML = `${localStorage.getItem('begName')} with ${localStorage.getItem('beginnerTime')} seconds`;
    document.querySelector('#medium').innerHTML = `${localStorage.getItem('medName')} with ${localStorage.getItem('mediumTime')} seconds`;
    document.querySelector('#expert').innerHTML = `${localStorage.getItem('expName')} with ${localStorage.getItem('expertTime')} seconds`;
}