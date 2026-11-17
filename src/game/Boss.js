const PHASES = {
  1: {
    name: "THẮNG NGU — THE HUNTER",
    color: "#633044",
    maxHP: 1500,
    attackInterval: 2.25,
    bulletSpeed: 285,
    damage: 13,
    scale: 1,
  },
  2: {
    name: "THẮNG NGU — ABOMINATION",
    color: "#54264b",
    maxHP: 2600,
    attackInterval: 1.75,
    bulletSpeed: 335,
    damage: 17,
    scale: 1.19,
  },
  3: {
    name: "THẮNG NGU — THE DEVOURER",
    color: "#681c29",
    maxHP: 4200,
    attackInterval: 1.35,
    bulletSpeed: 390,
    damage: 22,
    scale: 1.42,
  },
};

const ATTACKS = {
  1: ["aimed", "claw", "groundWave", "spread"],
  2: ["spread", "tentacles", "rain", "groundWave", "aimed"],
  3: ["laser", "spikes", "burst", "rain", "tentacles"],
};

export default class Boss {
  constructor() {
    this.x = 730;
    this.y = 305;
    this.width = 145;
    this.height = 155;
    this.phase = 1;
    this.config = PHASES[1];
    this.hp = this.config.maxHP;
    this.maxHP = this.hp;
    this.attackTimer = 0;
    this.warningTimer = 0;
    this.pendingAttack = null;
    this.attackIndex = 0;
    this.animationTime = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.roar = 0;
    this.maxMana = 100;
    this.mana = 0;
    this.manaRate = 5;
    this.stunTimer = 0;
    this.silenceTimer = 0;
    this.fearTimer = 0;
    this.laserCooldown = 0;
  }

  update(deltaTime) {
    if (this.dead) return null;
    this.animationTime += deltaTime;
    this.stunTimer = Math.max(0, this.stunTimer - deltaTime);
    this.silenceTimer = Math.max(0, this.silenceTimer - deltaTime);
    this.fearTimer = Math.max(0, this.fearTimer - deltaTime);
    this.laserCooldown = Math.max(0, this.laserCooldown - deltaTime);
    this.mana = Math.min(this.maxMana, this.mana + this.manaRate * deltaTime);
    if (this.stunTimer > 0 || this.fearTimer > 0 || this.silenceTimer > 0) return null;
    if (this.mana >= this.maxMana && this.silenceTimer <= 0 && this.laserCooldown <= 0) {
      this.mana = 0;
      this.laserCooldown = 2;
      return "manaLaser";
    }
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.roar = Math.max(0, this.roar - deltaTime);

    if (this.warningTimer > 0) {
      this.warningTimer -= deltaTime;
      if (this.warningTimer <= 0) {
        const attack = this.pendingAttack;
        this.pendingAttack = null;
        this.attackTimer = 0;
        return attack;
      }
      return null;
    }

    this.attackTimer += deltaTime;
    if (this.attackTimer >= this.config.attackInterval) {
      const attacks = ATTACKS[this.phase];
      this.pendingAttack = attacks[this.attackIndex % attacks.length];
      this.attackIndex++;
      this.warningTimer = this.phase === 3 ? 0.52 : 0.72;
      this.roar = 0.5;
    }
    return null;
  }

  applyStatus(effect, duration) {
    if (effect === "stun") this.stunTimer = Math.max(this.stunTimer, duration);
    if (effect === "silence") this.silenceTimer = Math.max(this.silenceTimer, duration);
    if (effect === "fear") this.fearTimer = Math.max(this.fearTimer, duration);
  }

  getHitbox() {
    const scale = this.config.scale;
    return {
      x: this.x + 12,
      y: this.y - 78 * scale,
      width: 120 * scale,
      height: 145 * scale,
    };
  }

  takeDamage(damage) {
    if (this.dead) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.hitFlash = 0.13;

    if (this.hp <= 0) {
      if (this.phase < 3) {
        this.phase++;
        this.config = PHASES[this.phase];
        this.maxHP = this.config.maxHP;
        this.hp = this.maxHP;
        this.attackTimer = 0;
        this.warningTimer = 0;
        this.pendingAttack = null;
        this.attackIndex = 0;
        this.roar = 1.2;
        return true;
      }
      this.dead = true;
      return true;
    }
    return false;
  }

  getHealthPercent() {
    return this.hp / this.maxHP;
  }

  getPhaseName() {
    return this.config.name;
  }

  rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();

    const pulse = 1 + Math.sin(this.animationTime * 3.2) * 0.025;
    const scale = this.config.scale * pulse;
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.scale(scale, scale);

    const body = this.hitFlash > 0 ? "#fff1ef" : this.config.color;
    const dark = "#170d18";
    const deeper = "#09070d";
    const bone = "#cbb5a8";
    const red = this.phase === 3 ? "#ff292f" : "#e33d55";

    // Shadow, rear tendrils and torn silhouette.
    this.rect(ctx, -91, 76, 185, 15, "rgba(0,0,0,0.5)");
    for (let i = 0; i < (this.phase >= 2 ? 5 : 3); i++) {
      const sway = Math.sin(this.animationTime * 2.7 + i) * 12;
      this.rect(ctx, -72 + i * 32, -24 + sway, 13, 98, dark);
      this.rect(ctx, -77 + i * 32, 55 + sway, 20, 12, body);
    }

    // Horn crown.
    this.rect(ctx, -66, -95, 24, 53, dark);
    this.rect(ctx, -78, -116, 21, 37, bone);
    this.rect(ctx, 42, -94, 25, 54, dark);
    this.rect(ctx, 58, -119, 21, 40, bone);
    if (this.phase >= 2) {
      this.rect(ctx, -23, -105, 18, 45, dark);
      this.rect(ctx, -27, -125, 12, 30, red);
      this.rect(ctx, 10, -105, 18, 45, dark);
      this.rect(ctx, 17, -125, 12, 30, red);
    }

    // Broad back, shoulders and ribbed torso.
    this.rect(ctx, -76, -54, 152, 133, deeper);
    this.rect(ctx, -65, -62, 130, 132, body);
    this.rect(ctx, -87, -42, 33, 72, dark);
    this.rect(ctx, 54, -42, 33, 72, dark);
    this.rect(ctx, -94, 12, 28, 52, body);
    this.rect(ctx, 66, 12, 28, 52, body);

    // Jagged claws.
    for (let i = 0; i < 4; i++) {
      this.rect(ctx, -96 + i * 7, 57 + (i % 2) * 5, 6, 18, bone);
      this.rect(ctx, 70 + i * 7, 57 + (i % 2) * 5, 6, 18, bone);
    }

    // Legs and armored knees.
    this.rect(ctx, -48, 59, 35, 37, dark);
    this.rect(ctx, 13, 59, 35, 37, dark);
    this.rect(ctx, -57, 84, 48, 13, deeper);
    this.rect(ctx, 8, 84, 49, 13, deeper);

    // Face plate, cheek bones and jaw.
    this.rect(ctx, -57, -54, 114, 95, dark);
    this.rect(ctx, -47, -58, 94, 84, body);
    this.rect(ctx, -57, -13, 23, 42, dark);
    this.rect(ctx, 34, -13, 23, 42, dark);
    this.rect(ctx, -39, -27, 31, 17, "#fff0d9");
    this.rect(ctx, 8, -27, 31, 17, "#fff0d9");
    this.rect(ctx, -29, -25, 15, 13, red);
    this.rect(ctx, 17, -25, 15, 13, red);
    this.rect(ctx, -24, -23, 5, 8, "#07060b");
    this.rect(ctx, 22, -23, 5, 8, "#07060b");

    // Nose cavity and split jaw.
    this.rect(ctx, -11, -5, 22, 20, deeper);
    this.rect(ctx, -37, 18, 74, 35, "#100811");
    this.rect(ctx, -31, 18, 12, 17, "#f2e4d4");
    this.rect(ctx, -10, 18, 11, 18, "#f2e4d4");
    this.rect(ctx, 13, 18, 12, 17, "#f2e4d4");
    this.rect(ctx, -23, 43, 10, 13, bone);
    this.rect(ctx, 13, 43, 10, 13, bone);

    // Exposed glowing heart and cracks.
    this.rect(ctx, -23, 48, 46, 28, "#210c1a");
    this.rect(ctx, -15, 51, 30, 20, red);
    this.rect(ctx, -7, 55, 14, 12, "#ffb0a0");
    if (this.phase >= 2) {
      this.rect(ctx, -55, -5, 8, 55, red);
      this.rect(ctx, 47, -7, 8, 58, red);
      for (let i = 0; i < 6; i++) {
        this.rect(ctx, -56 + i * 21, -80 - (i % 2) * 8, 7, 23, red);
      }
    }
    if (this.phase === 3) {
      this.rect(ctx, -88, -25, 20, 20, red);
      this.rect(ctx, 68, -25, 20, 20, red);
      this.rect(ctx, -13, -91, 26, 13, "#ff7a55");
    }

    // Warning aura telegraphs the next move.
    if (this.warningTimer > 0) {
      ctx.globalAlpha = 0.2 + Math.sin(this.animationTime * 24) * 0.12;
      ctx.fillStyle = this.phase === 3 ? "#ff253d" : "#e94b75";
      ctx.beginPath();
      ctx.ellipse(0, 8, 112, 118, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
