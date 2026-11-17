
"use client";

import { useState } from "react";

import MainMenu from "@/components/MainMenu";
import CharacterSelect from "@/components/CharacterSelect";
import GameCanvas from "@/components/GameCanvas";

export default function Home() {
  const [screen, setScreen] = useState("menu");
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const startGame = () => {
    setScreen("select");
  };

  const selectCharacter = (character) => {
    setSelectedCharacter(character);
    setScreen("game");
  };

  const backToMenu = () => {
    setScreen("menu");
    setSelectedCharacter(null);
  };

  return (
    <main className="game-container">
      {screen === "menu" && (
        <MainMenu onStart={startGame} />
      )}

      {screen === "select" && (
        <CharacterSelect
          onSelect={selectCharacter}
          onBack={backToMenu}
        />
      )}

      {screen === "game" && (
        <GameCanvas
          key={selectedCharacter}
          character={selectedCharacter}
          onExit={backToMenu}
        />
      )}
    </main>
  );
}
