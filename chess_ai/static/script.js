const PIECES = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const INITIAL_COUNTS = {
    white: { P: 8, R: 2, N: 2, B: 2, Q: 1, K: 1 },
    black: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
};

const boardEl = document.getElementById("chessboard");
const turnEl = document.getElementById("turn");
const statusEl = document.getElementById("game-status");
const whiteCapturesEl = document.getElementById("white-captures");
const blackCapturesEl = document.getElementById("black-captures");
const resetBtn = document.getElementById("reset-btn");

const state = {
    fen: "",
    boardMap: {},
    turn: "white",
    status: "In progress",
    selectedSquare: null,
    legalTargets: [],
    isSubmittingMove: false,
    dragFrom: null,
    isGameOver: false,
};

function squareToCoords(square) {
    const file = FILES.indexOf(square[0]);
    const rank = Number(square[1]);
    return { row: 8 - rank, col: file };
}

function coordsToSquare(row, col) {
    return `${FILES[col]}${8 - row}`;
}

function parseFenBoard(fen) {
    const boardPart = fen.split(" ")[0];
    const rows = boardPart.split("/");
    const map = {};

    rows.forEach((rowValue, rowIndex) => {
        let col = 0;
        rowValue.split("").forEach((char) => {
            if (!Number.isNaN(Number(char))) {
                col += Number(char);
            } else {
                const square = coordsToSquare(rowIndex, col);
                map[square] = char;
                col += 1;
            }
        });
    });
    return map;
}

function isTurnPiece(piece) {
    if (!piece) return false;
    return (
        (state.turn === "white" && piece === piece.toUpperCase()) ||
        (state.turn === "black" && piece === piece.toLowerCase())
    );
}

function getPseudoLegalTargets(fromSquare) {
    const piece = state.boardMap[fromSquare];
    if (!piece) return [];

    const { row, col } = squareToCoords(fromSquare);
    const targets = [];
    const type = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    const isEnemy = (occupant) =>
        occupant && (occupant === occupant.toUpperCase()) !== isWhite;

    function addSlidingMoves(directions) {
        directions.forEach(([dr, dc]) => {
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const sq = coordsToSquare(r, c);
                const occupying = state.boardMap[sq];
                if (!occupying) {
                    targets.push(sq);
                } else {
                    if (isEnemy(occupying)) targets.push(sq);
                    break;
                }
                r += dr;
                c += dc;
            }
        });
    }

    if (type === "p") {
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        const oneStepRow = row + direction;
        if (oneStepRow >= 0 && oneStepRow < 8) {
            const oneStepSquare = coordsToSquare(oneStepRow, col);
            if (!state.boardMap[oneStepSquare]) {
                targets.push(oneStepSquare);
                if (row === startRow) {
                    const twoStepSquare = coordsToSquare(row + direction * 2, col);
                    if (!state.boardMap[twoStepSquare]) targets.push(twoStepSquare);
                }
            }
        }
        [-1, 1].forEach((dc) => {
            const c = col + dc;
            const r = row + direction;
            if (c < 0 || c > 7 || r < 0 || r > 7) return;
            const sq = coordsToSquare(r, c);
            if (isEnemy(state.boardMap[sq])) targets.push(sq);
        });
    } else if (type === "n") {
        const jumps = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1],
        ];
        jumps.forEach(([dr, dc]) => {
            const r = row + dr;
            const c = col + dc;
            if (r < 0 || r > 7 || c < 0 || c > 7) return;
            const sq = coordsToSquare(r, c);
            const occupant = state.boardMap[sq];
            if (!occupant || isEnemy(occupant)) targets.push(sq);
        });
    } else if (type === "b") {
        addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    } else if (type === "r") {
        addSlidingMoves([[-1, 0], [1, 0], [0, -1], [0, 1]]);
    } else if (type === "q") {
        addSlidingMoves([
            [-1, -1], [-1, 1], [1, -1], [1, 1],
            [-1, 0], [1, 0], [0, -1], [0, 1],
        ]);
    } else if (type === "k") {
        for (let dr = -1; dr <= 1; dr += 1) {
            for (let dc = -1; dc <= 1; dc += 1) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                if (r < 0 || r > 7 || c < 0 || c > 7) continue;
                const sq = coordsToSquare(r, c);
                const occupant = state.boardMap[sq];
                if (!occupant || isEnemy(occupant)) targets.push(sq);
            }
        }
    }

    return targets;
}

function createBoard() {
    boardEl.innerHTML = "";
    for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            const squareName = coordsToSquare(row, col);
            const square = document.createElement("div");
            square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
            square.dataset.square = squareName;
            square.addEventListener("click", () => handleSquareClick(squareName));
            square.addEventListener("dragover", (event) => event.preventDefault());
            square.addEventListener("drop", (event) => handleDrop(event, squareName));
            boardEl.appendChild(square);
        }
    }
}

function renderBoard() {
    document.querySelectorAll(".square").forEach((el) => {
        const square = el.dataset.square;
        const piece = state.boardMap[square];
        if (piece) {
            const draggable = isTurnPiece(piece) && !state.isSubmittingMove && !state.isGameOver;
            el.innerHTML = `<span class="piece" draggable="${draggable}" data-square="${square}">${PIECES[piece]}</span>`;
            const pieceEl = el.querySelector(".piece");
            pieceEl.addEventListener("dragstart", (event) => handleDragStart(event, square));
            pieceEl.addEventListener("dragend", handleDragEnd);
        } else {
            el.innerHTML = "";
        }
        el.classList.toggle("selected", square === state.selectedSquare);
        el.classList.toggle("legal-target", state.legalTargets.includes(square));
    });
}

function updateStatusPanel() {
    turnEl.textContent = state.turn[0].toUpperCase() + state.turn.slice(1);
    statusEl.textContent = state.isGameOver ? `Game Over: ${state.status}` : state.status;
}

function countCurrentPieces() {
    const current = {
        white: { P: 0, R: 0, N: 0, B: 0, Q: 0, K: 0 },
        black: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    };
    Object.values(state.boardMap).forEach((piece) => {
        if (piece === piece.toUpperCase()) current.white[piece] += 1;
        else current.black[piece] += 1;
    });
    return current;
}

function updateCapturedPieces() {
    const current = countCurrentPieces();
    const whiteCapturedByBlack = [];
    const blackCapturedByWhite = [];

    Object.keys(INITIAL_COUNTS.white).forEach((piece) => {
        const captured = INITIAL_COUNTS.white[piece] - current.white[piece];
        for (let i = 0; i < captured; i += 1) whiteCapturedByBlack.push(PIECES[piece]);
    });
    Object.keys(INITIAL_COUNTS.black).forEach((piece) => {
        const captured = INITIAL_COUNTS.black[piece] - current.black[piece];
        for (let i = 0; i < captured; i += 1) blackCapturedByWhite.push(PIECES[piece]);
    });

    whiteCapturesEl.textContent = blackCapturedByWhite.join(" ");
    blackCapturesEl.textContent = whiteCapturedByBlack.join(" ");
}

function clearSelection() {
    state.selectedSquare = null;
    state.legalTargets = [];
    state.dragFrom = null;
}

function handleDragStart(event, fromSquare) {
    if (state.isSubmittingMove || state.isGameOver) {
        event.preventDefault();
        return;
    }
    const piece = state.boardMap[fromSquare];
    if (!isTurnPiece(piece)) {
        event.preventDefault();
        return;
    }
    state.dragFrom = fromSquare;
    state.selectedSquare = fromSquare;
    state.legalTargets = getPseudoLegalTargets(fromSquare);
    event.dataTransfer.setData("text/plain", fromSquare);
    renderBoard();
}

function handleDragEnd() {
    if (!state.isSubmittingMove) {
        clearSelection();
        renderBoard();
    }
}

function handleDrop(event, toSquare) {
    event.preventDefault();
    const fromSquare = event.dataTransfer.getData("text/plain") || state.dragFrom;
    if (!fromSquare) return;
    if (!state.legalTargets.includes(toSquare)) {
        clearSelection();
        renderBoard();
        return;
    }
    clearSelection();
    renderBoard();
    submitMove(fromSquare, toSquare);
}

async function fetchState() {
    const response = await fetch("/state");
    const data = await response.json();
    state.fen = data.fen;
    state.boardMap = parseFenBoard(data.fen);
    state.turn = data.turn;
    state.status = data.status;
    state.isGameOver = data.is_game_over;
    clearSelection();
    renderBoard();
    updateStatusPanel();
    updateCapturedPieces();
}

async function submitMove(from, to) {
    if (state.isSubmittingMove || state.isGameOver) return;
    state.isSubmittingMove = true;

    const fromEl = document.querySelector(`[data-square="${from}"]`);
    const toEl = document.querySelector(`[data-square="${to}"]`);
    fromEl?.classList.add("pending");
    toEl?.classList.add("pending");

    try {
        const response = await fetch("/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ move: `${from}${to}` }),
        });
        const data = await response.json();

        if (!response.ok) {
            statusEl.textContent = `Illegal move: ${data.error || "Move rejected"}`;
            alert(data.error || "Illegal move");
            return;
        }

        state.fen = data.fen;
        state.boardMap = parseFenBoard(data.fen);
        state.turn = data.turn;
        state.status = data.status;
        state.isGameOver = data.is_game_over;
        clearSelection();
        renderBoard();
        updateStatusPanel();
        updateCapturedPieces();
    } catch (error) {
        statusEl.textContent = "Network error while sending move.";
        alert("Network error while sending move.");
    } finally {
        fromEl?.classList.remove("pending");
        toEl?.classList.remove("pending");
        state.isSubmittingMove = false;
    }
}

function handleSquareClick(square) {
    if (state.isSubmittingMove || state.isGameOver) return;

    const clickedPiece = state.boardMap[square];
    const clickedIsTurnPiece = isTurnPiece(clickedPiece);

    if (!state.selectedSquare) {
        if (clickedIsTurnPiece) {
            state.selectedSquare = square;
            state.legalTargets = getPseudoLegalTargets(square);
            renderBoard();
        }
        return;
    }

    if (square === state.selectedSquare) {
        clearSelection();
        renderBoard();
        return;
    }

    if (state.legalTargets.includes(square)) {
        const from = state.selectedSquare;
        clearSelection();
        renderBoard();
        submitMove(from, square);
        return;
    }

    if (clickedIsTurnPiece) {
        state.selectedSquare = square;
        state.legalTargets = getPseudoLegalTargets(square);
    } else {
        clearSelection();
    }
    renderBoard();
}

async function resetGame() {
    const response = await fetch("/reset", { method: "POST" });
    const data = await response.json();
    state.fen = data.fen;
    state.boardMap = parseFenBoard(data.fen);
    state.turn = data.turn;
    state.status = data.status;
    state.isGameOver = data.is_game_over;
    clearSelection();
    renderBoard();
    updateStatusPanel();
    updateCapturedPieces();
}

resetBtn.addEventListener("click", resetGame);

createBoard();
fetchState();
