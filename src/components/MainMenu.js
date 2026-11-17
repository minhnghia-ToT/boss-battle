
"use client";

export default function MainMenu({ onStart }) {
  const showInstructions = () => {
    alert(
      "HƯỚNG DẪN\n\n" +
      "A / D hoặc ← / → : Di chuyển\n" +
      "Q : Bắn phép\n" +
      "Q + E : Tuyệt chiêu khi đủ Mana\n" +
      "M + N : Triệu hồi nhân vật bí ẩn\n\n" +
      "Hãy đánh bại Thắng Ngu!"
    );
  };

  const exitGame = () => {
    alert("Cảm ơn bạn đã ghé thăm Boss Battle!");
  };

  return (
    <section className="menu-screen">
      <div className="menu-background">
        <div className="pixel-stars">✦　·　✧　·　✦</div>

        <div className="menu-content">
          <p className="game-subtitle">
            AN EPIC PIXEL ADVENTURE
          </p>

          <h1 className="game-title">
            BOSS
            <span>BATTLE</span>
          </h1>

          <div className="boss-title">
            THE FINAL ENEMY: THẮNG NGU
          </div>

          <div className="menu-character">
            <span>★</span>
            <span>🐰</span>
            <span>🐻</span>
          </div>

          <div className="menu-buttons">
            <button
              className="menu-button primary"
              onClick={onStart}
            >
              <span>▶</span> CHƠI MỚI
            </button>

            <button
              className="menu-button"
              onClick={showInstructions}
            >
              GIẢI THÍCH
            </button>

            <button
              className="menu-button exit"
              onClick={exitGame}
            >
              THOÁT GAME
            </button>
          </div>

          <p className="menu-footer">
            © 2026 BOSS BATTLE - ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </section>
  );
}
