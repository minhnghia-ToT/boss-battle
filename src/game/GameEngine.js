import Player from "./Player";
import Boss from "./Boss";
import Projectile from "./Projectile";
import SkillSystem from "./SkillSystem";
import CheatSystem from "./CheatSystem";

export default class GameEngine {
  constructor(ctx, character) {
    this.ctx = ctx;
    this.width = 960;
    this.height = 540;
    this.groundY = 455;

    this.player = new Player(character);
    this.boss = new Boss();
    this.skillSystem = new SkillSystem();
    this.cheatSystem = new CheatSystem();
    this.projectiles = [];

    this.status = "dialogue";
    this.pendingResult = null;
    this.dialogueQueue = [];
    this.dialogue = null;
    this.dialogueWasDown = false;
    this.elapsedTime = 0;
    this.bossHitFlash = 0;
    this.activeFighter = "player";
    this.bossDefeatDialogueQueued = false;

    this.showDialogues([
      { speaker: "PLAYER", message: "Mình phải kết thúc chuyện này..." },
      { speaker: "THẮNG NGU", message: "Ngươi nghĩ chút phép thuật đó có thể làm ta bị thương sao?" },
      { speaker: "THẮNG NGU", message: "Đến đây. Ta sẽ nghiền nát ngươi!" },
    ]);
  }

  get currentFighter() {
    if (this.activeFighter === "secret" && this.cheatSystem.secretAlly?.active) {
      return this.cheatSystem.secretAlly;
    }
    return this.player;
  }

  showDialogues(dialogues) {
    this.dialogueQueue.push(...dialogues);
    if (this.dialogueQueue.length && !this.dialogue) {
      this.dialogue = this.dialogueQueue.shift();
      this.status = "dialogue";
      this.dialogueWasDown = false;
    }
  }

  updateDialogue(keys) {
    const confirm = keys.has("enter") || keys.has(" ");
    if (confirm && !this.dialogueWasDown) {
      this.dialogue = this.dialogueQueue.shift() || null;
      if (!this.dialogue) {
        this.status = this.pendingResult || "playing";
        this.pendingResult = null;
      }
    }
    this.dialogueWasDown = confirm;
  }

  update(keys, deltaTime) {
    if (this.status === "dialogue") {
      this.updateDialogue(keys);
      return;
    }
    if (this.status !== "playing") return;

    this.elapsedTime += deltaTime;
    const activated = this.cheatSystem.update(keys, deltaTime);

    if (activated) {
      this.activeFighter = "secret";
      this.projectiles = this.projectiles.filter((p) => p.owner !== "boss");
      this.showDialogues([
        { speaker: "UNKNOWN", message: "Cuối cùng cũng gọi tôi ra rồi à?" },
        { speaker: "UNKNOWN", message: "Lùi lại. Từ giờ để tôi chiến đấu." },
        { speaker: "THẮNG NGU", message: "Ngươi là thứ quái quỷ gì?!" },
      ]);
      return;
    }

    if (this.activeFighter === "player") {
      this.player.update(keys, deltaTime);
      this.skillSystem.update(deltaTime);
      this.skillSystem.handleInput(keys, this.player, this.projectiles);
    } else {
      const ally = this.cheatSystem.secretAlly;
      if (ally?.active) {
        ally.update(keys, deltaTime);
        ally.handleInput(keys, this.projectiles);
      } else {
        this.activeFighter = "player";
        this.showDialogues([
          { speaker: "UNKNOWN", message: "Khốn... tôi không thể giữ hình thái này lâu hơn." },
          { speaker: "PLAYER", message: "Đến lượt mình kết thúc trận chiến!" },
        ]);
        return;
      }
    }

    const bossAttack = this.boss.update(deltaTime);
    if (bossAttack) this.executeBossAttack(bossAttack);

    this.updateProjectiles(deltaTime);
    this.bossHitFlash = Math.max(0, this.bossHitFlash - deltaTime);

    const defeatedFighter = this.activeFighter === "secret"
      ? this.cheatSystem.secretAlly
      : this.player;

    if (defeatedFighter && defeatedFighter.hp <= 0) {
      if (this.activeFighter === "secret") {
        this.cheatSystem.secretAlly.active = false;
        this.activeFighter = "player";
        if (this.player.hp <= 0) this.status = "gameover";
        else this.showDialogues([
          { speaker: "UNKNOWN", message: "Tôi giao phần còn lại cho cậu..." },
          { speaker: "PLAYER", message: "Mình vẫn chưa bỏ cuộc!" },
        ]);
      } else {
        this.status = "gameover";
      }
    }
  }

  addBossProjectile(options) {
    this.projectiles.push(new Projectile({
      owner: "boss",
      color: "#f04b68",
      radius: 10,
      ...options,
    }));
  }

  executeBossAttack(type) {
    if (type === "manaLaser") {
      const fighter = this.currentFighter;
      const target = fighter.getHitbox();
      this.addBossProjectile({
        x: 430,
        y: target.y + target.height / 2,
        vx: 0,
        vy: 0,
        damage: 28,
        width: 720,
        height: 48,
        radius: 24,
        color: "#b8f7ff",
        type: "boss-laser",
        lifetime: 0.85,
        bleeding: true,
      });
      return;
    }
    const fighter = this.currentFighter;
    const box = fighter.getHitbox();
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;
    const startX = this.boss.x - 20;
    const startY = this.boss.y + 65;
    const speed = this.boss.config.bulletSpeed;
    const damage = this.boss.config.damage;
    const travel = Math.max(0.3, (startX - targetX) / speed);
    const aimedVy = (targetY - startY) / travel;

    if (type === "aimed" || type === "claw") {
      const count = type === "claw" ? 3 : 1;
      for (let i = 0; i < count; i++) {
        this.addBossProjectile({
          x: startX,
          y: startY + (i - 1) * 18,
          vx: -speed * (type === "claw" ? 1.12 : 1),
          vy: aimedVy + (i - 1) * 65,
          damage,
          type: "orb",
          color: "#ff6476",
          radius: type === "claw" ? 13 : 10,
        });
      }
      return;
    }

    if (type === "spread" || type === "burst") {
      const count = type === "burst" ? 9 : 5;
      for (let i = 0; i < count; i++) {
        const angle = type === "burst"
          ? Math.PI + (Math.PI * 2 * i) / count
          : -0.75 + (1.5 * i) / (count - 1);
        const velocity = type === "burst" ? 280 : speed;
        const vx = type === "burst" ? Math.cos(angle) * velocity : -velocity;
        const vy = type === "burst" ? Math.sin(angle) * velocity : aimedVy + (i - 2) * 105;
        this.addBossProjectile({
          x: startX,
          y: startY,
          vx,
          vy,
          damage: damage * (type === "burst" ? 0.8 : 0.75),
          radius: type === "burst" ? 11 : 9,
          color: type === "burst" ? "#ff394e" : "#d76aff",
          type: "orb",
        });
      }
      return;
    }

    if (type === "groundWave") {
      this.addBossProjectile({
        x: startX,
        y: this.groundY - 28,
        vx: -430,
        vy: 0,
        damage: damage * 1.15,
        width: 76,
        height: 54,
        radius: 24,
        color: "#f35b61",
        type: "ground-wave",
        lifetime: 4,
      });
      return;
    }

    if (type === "tentacles" || type === "spikes") {
      const positions = type === "spikes"
        ? [targetX - 105, targetX, targetX + 105, targetX + 210]
        : [targetX - 55, targetX + 55, targetX + 165];
      positions.forEach((x, index) => {
        this.addBossProjectile({
          x,
          y: this.groundY + 10,
          vx: 0,
          vy: -360 - index * 18,
          damage: damage * 1.2,
          width: 42,
          height: 100,
          radius: 24,
          color: type === "spikes" ? "#ff354d" : "#a94a85",
          type: "spike",
          lifetime: 1.5,
        });
      });
      return;
    }

    if (type === "rain") {
      for (let i = 0; i < 7; i++) {
        const x = Math.max(90, Math.min(820, targetX - 210 + i * 70));
        this.addBossProjectile({
          x,
          y: 95 - (i % 3) * 24,
          vx: -25,
          vy: 320 + (i % 3) * 35,
          damage: damage * 0.9,
          width: 19,
          height: 34,
          radius: 11,
          color: "#d85c9d",
          type: "spike",
          lifetime: 2.3,
        });
      }
      return;
    }

    if (type === "laser") {
      this.addBossProjectile({
        x: 430,
        y: targetY,
        vx: 0,
        vy: 0,
        damage: damage * 1.6,
        width: 690,
        height: 34,
        radius: 17,
        color: "#ff304f",
        type: "boss-laser",
        lifetime: 0.75,
      });
    }
  }

  intersects(a, b) {
    return a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;
  }

  updateProjectiles(deltaTime) {
    const fighter = this.currentFighter;
    const fighterBox = fighter.getHitbox();
    const bossBox = this.boss.getHitbox();
    let phaseChanged = false;
    let bossDefeated = false;

    for (const projectile of this.projectiles) {
      if (!projectile.active) continue;
      projectile.update(deltaTime);
      const hitbox = projectile.getHitbox();

      if (projectile.owner === "player" || projectile.owner === "secret") {
        if (this.intersects(hitbox, bossBox)) {
          const oldPhase = this.boss.phase;
          this.boss.takeDamage(projectile.damage);
          if (projectile.statusEffect) {
            this.boss.applyStatus(projectile.statusEffect, projectile.statusDuration);
          }
          projectile.active = false;
          this.bossHitFlash = 0.14;
          if (projectile.owner === "player") this.player.addMana(2.5);
          if (this.boss.phase !== oldPhase) phaseChanged = true;
          if (this.boss.dead) bossDefeated = true;
        }
      } else if (projectile.owner === "boss") {
        if (this.intersects(hitbox, fighterBox)) {
          fighter.takeDamage(projectile.damage);
          if (projectile.bleeding && fighter === this.player) {
            fighter.bleedTimer = Math.max(fighter.bleedTimer, 5);
            fighter.bleedTick = 0;
          }
          projectile.active = false;
        }
      }
    }

    this.projectiles = this.projectiles.filter((p) => p.active);

    if (bossDefeated && !this.bossDefeatDialogueQueued) {
      this.bossDefeatDialogueQueued = true;
      this.pendingResult = "victory";
      this.showDialogues([
        { speaker: "THẮNG NGU", message: "Không... thể... nào...!" },
        { speaker: this.activeFighter === "secret" ? "UNKNOWN" : "PLAYER", message: "Mọi chuyện kết thúc ở đây." },
      ]);
      return;
    }

    if (phaseChanged) {
      const phase = this.boss.phase;
      const speaker = this.activeFighter === "secret" ? "UNKNOWN" : "PLAYER";
      this.showDialogues([
        {
          speaker: "THẮNG NGU",
          message: phase === 2
            ? "Ngươi đã phá hủy lớp vỏ đầu tiên... vậy hãy nhìn hình dạng thật của ta!"
            : "TA SẼ XÉ NÁT CẢ LINH HỒN NGƯƠI!",
        },
        {
          speaker,
          message: phase === 2
            ? "Thứ đó... vẫn chưa phải toàn bộ sức mạnh của hắn."
            : "Một luồng tà khí khủng khiếp... phải kết thúc ngay!",
        },
      ]);
    }
  }

  drawBackground() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#0b1221");
    gradient.addColorStop(0.55, "#201827");
    gradient.addColorStop(1, "#080910");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Distant moon and ruined skyline.
    ctx.fillStyle = "#b6c2d3";
    ctx.fillRect(765, 66, 58, 58);
    ctx.fillStyle = "#0b1221";
    ctx.fillRect(785, 56, 46, 47);

    ctx.fillStyle = "#171a2a";
    for (let i = 0; i < 8; i++) {
      const x = i * 138 - 20;
      const h = 65 + (i % 3) * 35;
      ctx.fillRect(x, 390 - h, 88, h);
      ctx.fillRect(x + 14, 365 - h, 9, 24);
      ctx.fillRect(x + 63, 350 - h, 8, 40);
    }

    ctx.fillStyle = "#211c30";
    ctx.beginPath();
    ctx.moveTo(0, 405);
    ctx.lineTo(130, 250);
    ctx.lineTo(240, 405);
    ctx.lineTo(420, 265);
    ctx.lineTo(600, 405);
    ctx.lineTo(780, 235);
    ctx.lineTo(960, 405);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#171824";
    ctx.fillRect(0, this.groundY, this.width, 85);
    ctx.fillStyle = "#484052";
    ctx.fillRect(0, this.groundY, this.width, 6);
    ctx.fillStyle = "#332d3c";
    for (let x = 0; x < this.width; x += 40) {
      ctx.fillRect(x, this.groundY + 25, 20, 5);
      ctx.fillRect(x + 15, this.groundY + 55, 12, 5);
    }
  }

  drawHealthBar(x, y, width, height, percent, color) {
    const ctx = this.ctx;
    ctx.fillStyle = "#090911";
    ctx.fillRect(x - 3, y - 3, width + 6, height + 6);
    ctx.fillStyle = "#3c3544";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * Math.max(0, Math.min(1, percent)), height);
  }

  drawHUD() {
    const ctx = this.ctx;
    const fighter = this.currentFighter;
    const isSecret = this.activeFighter === "secret" && fighter === this.cheatSystem.secretAlly;

    ctx.font = "bold 13px monospace";
    ctx.fillStyle = isSecret ? "#8feaff" : "#ffffff";
    ctx.fillText(isSecret ? "THE UNKNOWN SWORDSMAN" : this.player.config.name, 35, 28);

    this.drawHealthBar(35, 40, 250, 15, fighter.hp / fighter.maxHP, isSecret ? "#42d9f2" : "#e74757");
    ctx.font = "11px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`HP ${Math.ceil(fighter.hp)} / ${fighter.maxHP}`, 35, 72);

    if (isSecret) {
      ctx.fillStyle = "#8feaff";
      ctx.fillText("SWORD ENERGY", 35, 98);
      this.drawHealthBar(35, 107, 250, 12, fighter.mana / fighter.maxMana, "#42cce9");
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${Math.floor(fighter.mana)} / 100`, 35, 133);
    } else {
      ctx.fillStyle = "#80d9ff";
      ctx.fillText("MANA", 35, 98);
      this.drawHealthBar(35, 107, 250, 12, this.player.mana / 100, "#42a9ee");
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${Math.floor(this.player.mana)} / 100`, 35, 133);
      if (this.player.damageBuffTimer > 0) {
        ctx.fillStyle = "#ffc45c";
        ctx.fillText(`HONEY POWER ${Math.ceil(this.player.damageBuffTimer)}s`, 35, 151);
      }
      if (this.player.bleedTimer > 0) {
        ctx.fillStyle = "#ff6878";
        ctx.fillText(`BLEEDING ${Math.ceil(this.player.bleedTimer)}s`, 35, 166);
      }
    }

    ctx.textAlign = "right";
    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "#ff777c";
    ctx.fillText(this.boss.getPhaseName(), 925, 28);
    this.drawHealthBar(585, 40, 340, 19, this.boss.getHealthPercent(), "#d72f45");
    ctx.textAlign = "right";
    ctx.font = "10px monospace";
    ctx.fillStyle = "#a9f3ff";
    ctx.fillText(`BOSS MANA ${Math.floor(this.boss.mana)} / 100`, 925, 94);
    this.drawHealthBar(705, 101, 220, 9, this.boss.mana / this.boss.maxMana, "#69e7ff");
    ctx.font = "11px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`PHASE ${this.boss.phase}  |  ${Math.ceil(this.boss.hp)} / ${this.boss.maxHP} HP`, 925, 76);
    const bossState = this.boss.stunTimer > 0
      ? `STUNNED ${this.boss.stunTimer.toFixed(1)}s`
      : this.boss.silenceTimer > 0
        ? `SILENCED ${this.boss.silenceTimer.toFixed(1)}s`
        : this.boss.fearTimer > 0
          ? `FEARED ${this.boss.fearTimer.toFixed(1)}s`
          : "";
    if (bossState) {
      ctx.fillStyle = "#ffe38a";
      ctx.fillText(bossState, 925, 126);
    }
    ctx.textAlign = "left";

    ctx.font = "11px monospace";
    ctx.fillStyle = "#ded9ea";
    ctx.fillText(
      isSecret
        ? "A/D/W/S FLY   Q SWORD WAVE   HOLD E CHARGE   Q+E ABSOLUTE ZERO"
        : "A/D MOVE   SPACE JUMP   S CROUCH   Q CAST   Q+E SPECIAL",
      35, 510
    );
    if (this.cheatSystem.unlocked && !isSecret) {
      ctx.fillStyle = "#8feaff";
      ctx.fillText("UNKNOWN SWORDSMAN: M + N", 690, 530);
    }
  }

  drawDialogue() {
    if (!this.dialogue) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.76)";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = "#151322";
    ctx.fillRect(100, 350, 760, 115);
    ctx.strokeStyle = "#82dff5";
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 350, 760, 115);
    ctx.fillStyle = this.dialogue.speaker === "THẮNG NGU" ? "#622b43" : "#27354b";
    ctx.fillRect(120, 330, 250, 30);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px monospace";
    ctx.fillText(this.dialogue.speaker, 135, 350);
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "17px monospace";
    this.wrapText(this.dialogue.message, 135, 397, 690, 25);
    ctx.fillStyle = "#8feaff";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.fillText("ENTER / SPACE - CONTINUE", 835, 445);
    ctx.textAlign = "left";
    ctx.restore();
  }

  wrapText(text, x, y, maxWidth, lineHeight) {
    const ctx = this.ctx;
    const words = text.split(" ");
    let line = "";
    let lineY = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, lineY);
        line = word;
        lineY += lineHeight;
      } else line = test;
    }
    if (line) ctx.fillText(line, x, lineY);
  }

  drawResult() {
    if (this.status !== "victory" && this.status !== "gameover") return;
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.86)";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.textAlign = "center";
    ctx.fillStyle = this.status === "victory" ? "#f4d35e" : "#ff6565";
    ctx.font = "bold 40px monospace";
    ctx.fillText(this.status === "victory" ? "VICTORY!" : "GAME OVER", 480, 245);
    ctx.fillStyle = "#ffffff";
    ctx.font = "17px monospace";
    ctx.fillText(
      this.status === "victory" ? "THANG NGU HAS BEEN DEFEATED" : "YOUR JOURNEY ENDS HERE",
      480, 285
    );
    ctx.textAlign = "left";
  }

  draw() {
    const ctx = this.ctx;
    this.drawBackground();
    this.boss.draw(ctx);
    if (this.activeFighter === "player") this.player.draw(ctx);
    else this.cheatSystem.draw(ctx);
    this.projectiles.forEach((projectile) => projectile.draw(ctx));
    this.drawHUD();
    this.drawDialogue();
    this.drawResult();
  }
}
