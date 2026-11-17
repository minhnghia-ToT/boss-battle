
"use client";

import { useEffect, useRef, useState } from "react";
import GameEngine from "@/game/GameEngine";

export default function GameCanvas({ character, onExit }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const keysRef = useRef(new Set());

  const [gameStatus, setGameStatus] = useState("dialogue");

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;

    const engine = new GameEngine(ctx, character);

    engineRef.current = engine;
    keysRef.current.clear();

    let animationId;
    let previousTime = 0;
    let lastStatus = engine.status;

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();

      const blockedKeys = [
        "arrowleft",
        "arrowright",
        "arrowup",
        "arrowdown",
        " ",
      ];

      if (blockedKeys.includes(key)) {
        event.preventDefault();
      }

      keysRef.current.add(key);
    };

    const handleKeyUp = (event) => {
      keysRef.current.delete(event.key.toLowerCase());
    };

    const handleBlur = () => {
      keysRef.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    const loop = (timestamp) => {
      if (!previousTime) {
        previousTime = timestamp;
      }

      const deltaTime = Math.min(
        (timestamp - previousTime) / 1000,
        0.033
      );

      previousTime = timestamp;

      const currentEngine = engineRef.current;

      if (currentEngine) {
        currentEngine.update(
          keysRef.current,
          deltaTime
        );

        currentEngine.draw();

        if (currentEngine.status !== lastStatus) {
          lastStatus = currentEngine.status;
          setGameStatus(currentEngine.status);
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);

      keysRef.current.clear();
      engineRef.current = null;
    };
  }, [character]);

  const restartGame = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    engineRef.current = new GameEngine(ctx, character);

    keysRef.current.clear();

    setGameStatus("dialogue");
  };

  return (
    <section className="battle-screen">
      <header className="battle-header">
        <button
          onClick={onExit}
          className="battle-back"
        >
          ← MENU
        </button>

        <div className="battle-logo">
          THANG NGU BOSS BATTLE
        </div>

        <div className="battle-player">
          {character.toUpperCase()}
        </div>
      </header>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="game-canvas"
        />

        {(gameStatus === "gameover" ||
          gameStatus === "victory") && (
          <div className="battle-result">
            <button
              className="result-button"
              onClick={restartGame}
            >
              PLAY AGAIN
            </button>

            <button
              className="result-button secondary"
              onClick={onExit}
            >
              MAIN MENU
            </button>
          </div>
        )}
      </div>

      <div className="battle-controls">
        <p>
          MOVE: <strong>A / D</strong>
        </p>

        <p>
          JUMP: <strong>SPACE</strong>
        </p>

        <p>
          CROUCH: <strong>S</strong>
        </p>

        <p>
          SHOOT: <strong>Q</strong>
        </p>

        <p>
          SPECIAL: <strong>Q + E</strong>
        </p>
      </div>

      <div className="secret-controls">
        <span>SECRET ALLY: M + N</span>
        <span>FLIGHT: I / J / K / L</span>
      </div>
    </section>
  );
}
