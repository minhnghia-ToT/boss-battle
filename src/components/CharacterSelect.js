
"use client";

import { useState } from "react";

const characters = [
  {
    id: "star",
    name: "STAR",
    description: "Chiến binh ngôi sao",
    icon: "★",
    color: "#55c5df",
    skill: "STAR MAGIC",
    detail: "Bắn những viên phép thuật năng lượng."
  },
  {
    id: "rabbit",
    name: "RABBIT",
    description: "Chiến binh thỏ",
    icon: "🐰",
    color: "#e9e9e9",
    skill: "RABBIT SHOT",
    detail: "Bắn phép nhanh với tốc độ cao."
  },
  {
    id: "bear",
    name: "BEAR",
    description: "Chiến binh gấu",
    icon: "🐻",
    color: "#e4a85b",
    skill: "BEAR POWER",
    detail: "Bắn đạn phép có sức công phá lớn."
  }
];

export default function CharacterSelect({ onSelect, onBack }) {
  const [selected, setSelected] = useState("star");

  const currentCharacter = characters.find(
    (character) => character.id === selected
  );

  return (
    <section className="select-screen">
      <div className="select-header">
        <button className="back-button" onClick={onBack}>
          ← BACK
        </button>

        <p>CHOOSE YOUR FIGHTER</p>

        <span>PLAYER 01</span>
      </div>

      <h1 className="select-title">
        SELECT CHARACTER
      </h1>

      <p className="select-description">
        Choose your warrior to defeat THẮNG NGU.
      </p>

      <div className="character-list">
        {characters.map((character) => (
          <button
            key={character.id}
            className={`character-card ${
              selected === character.id ? "active" : ""
            }`}
            onClick={() => setSelected(character.id)}
            style={{ "--character-color": character.color }}
          >
            <div className="character-preview">
              {character.icon}
            </div>

            <h2>{character.name}</h2>

            <p>{character.description}</p>

            {selected === character.id && (
              <span className="selected-label">
                SELECTED
              </span>
            )}
          </button>
        ))}
      </div>

      {currentCharacter && (
        <div className="character-info">
          <div>
            <span className="info-label">SPECIAL SKILL</span>
            <h2>{currentCharacter.skill}</h2>
            <p>{currentCharacter.detail}</p>
          </div>
        </div>
      )}

      <button
        className="confirm-button"
        onClick={() => onSelect(selected)}
      >
        CONFIRM CHARACTER →
      </button>

      <p className="select-footer">
        THERE IS NO TURNING BACK.
      </p>
    </section>
  );
}
