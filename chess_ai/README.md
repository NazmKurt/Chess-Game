

# ♟️ Local Multiplayer Chess (Python Flask + JavaScript)

A simple and clean **2-player local chess game** built with **Python Flask** and **JavaScript**, powered by `python-chess` for reliable move validation and game state management.  
Both players use the same device, and there is **no AI**.

---

## ✨ Features

- ♜ **Local 2-player gameplay** on a single device
- ✅ **Legal move validation** using `python-chess`
- 🎯 **Interactive board UI** with click-to-move and drag-and-drop
- 🔄 **Live game state updates** (turn, check, checkmate, draw)
- 🧹 **Reset game** button for quick restarts
- 📦 **Minimal and clean architecture** (Flask backend + vanilla JS frontend)

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask, Flask-CORS
- **Game Logic:** python-chess
- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Environment Config:** python-dotenv

---

## 🚀 Installation

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd <your-repo-folder>/chess_ai
```

### 2) Create and activate a virtual environment (recommended)

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3) Install dependencies

```bash
pip install -r requirements.txt
```

### 4) Run the app

```bash
python app.py
```

Open your browser at: **http://127.0.0.1:5000**

---

## 🎮 How to Play

1. Start the app and open it in your browser.
2. White moves first.
3. Select a piece, then click a target square (or use drag-and-drop).
4. Turns alternate between White and Black on the same device.
5. Illegal moves are rejected.
6. Game status updates automatically (check, checkmate, draw).
7. Click **Reset Game** to start over.

---

## 📁 Project Structure

```text
chess_ai/
├── app.py
├── requirements.txt
├── .env
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

---

## 🔮 Future Improvements

- ♟️ Add move history panel (SAN/UCI notation)
- ↩️ Add undo/redo moves
- ⏱️ Add chess clock for timed games
- 📝 Add PGN export/import support
- 🎨 Add board themes and piece set customization

---

## 📄 License

This project is open-source and available under the **MIT License**.

---

## 👤 Author

**Nazım Kurt**  
GitHub: https://github.com/NazmKurt

<img width="1090" height="705" alt="Ekran Resmi 2026-04-14 15 22 44" src="https://github.com/user-attachments/assets/7439141e-a38d-458a-adb2-ec041711e010" />
