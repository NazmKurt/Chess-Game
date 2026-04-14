import os

import chess
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

board = chess.Board()


def get_game_status() -> str:
    if board.is_checkmate():
        return "Checkmate"
    if board.is_stalemate():
        return "Stalemate"
    if board.is_insufficient_material():
        return "Draw: Insufficient material"
    if board.can_claim_fifty_moves():
        return "Draw: Fifty-move rule"
    if board.can_claim_threefold_repetition():
        return "Draw: Threefold repetition"
    if board.is_check():
        return "Check"
    return "In progress"


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/state")
def state():
    return jsonify(
        {
            "fen": board.fen(),
            "turn": "white" if board.turn == chess.WHITE else "black",
            "status": get_game_status(),
            "is_game_over": board.is_game_over(),
        }
    )


@app.post("/reset")
def reset():
    board.reset()
    return jsonify(
        {
            "message": "Game reset",
            "fen": board.fen(),
            "turn": "white",
            "status": get_game_status(),
            "is_game_over": False,
        }
    )


@app.post("/move")
def make_move():
    if board.is_game_over():
        return (
            jsonify(
                {
                    "error": "Game is already over",
                    "fen": board.fen(),
                    "status": get_game_status(),
                }
            ),
            400,
        )

    data = request.get_json(silent=True) or {}
    player_move_uci = data.get("move", "").strip().lower()
    print(f"[MOVE] Player requested move: {player_move_uci!r}")

    try:
        player_move = chess.Move.from_uci(player_move_uci)
    except ValueError:
        return jsonify({"error": "Invalid move format. Use UCI like e2e4"}), 400

    if player_move not in board.legal_moves:
        print(f"[MOVE ERROR] Illegal player move: {player_move_uci}")
        return jsonify({"error": "Illegal move", "fen": board.fen()}), 400

    board.push(player_move)
    print(f"[MOVE] Player move applied: {player_move_uci}")

    return jsonify(
        {
            "move": player_move_uci,
            "fen": board.fen(),
            "turn": "white" if board.turn == chess.WHITE else "black",
            "status": get_game_status(),
            "is_game_over": board.is_game_over(),
        }
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
