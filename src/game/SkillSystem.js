import Projectile from "./Projectile";

export default class SkillSystem {
  constructor() {
    this.normalCooldown = 0;
    this.specialCooldown = 0;
    this.specialManaCost = 100;
  }

  update(deltaTime) {
    this.normalCooldown = Math.max(0, this.normalCooldown - deltaTime);
    this.specialCooldown = Math.max(0, this.specialCooldown - deltaTime);
  }

  handleInput(keys, player, projectiles) {
    if (!keys.has("q")) return;
    if (keys.has("e")) {
      if (player.mana >= this.specialManaCost && this.specialCooldown <= 0) {
        this.useSpecial(player, projectiles);
      }
      return;
    }
    if (this.normalCooldown <= 0) this.useNormal(player, projectiles);
  }

  useNormal(player, projectiles) {
    const config = {
      star: { interval: 0.38, speed: 610, radius: 12, damage: 22, type: "spell-star", color: "#72eaff", width: 34, height: 28 },
      rabbit: { interval: 0.22, speed: 700, radius: 8, damage: 14, type: "spell-rabbit", color: "#f3f5ff", width: 28, height: 18 },
      bear: { interval: 0.62, speed: 490, radius: 17, damage: 38, type: "spell-bear", color: "#ffbd72", width: 42, height: 38 },
    };
    const skill = config[player.character];
    projectiles.push(new Projectile({
      x: player.x + player.width, y: player.y + 32,
      vx: skill.speed, vy: 0,
      damage: skill.damage * (player.damageBuffTimer > 0 ? 1.25 : 1),
      owner: "player", color: skill.color, radius: skill.radius,
      width: skill.width, height: skill.height, type: skill.type,
    }));
    this.normalCooldown = skill.interval;
  }

  useSpecial(player, projectiles) {
    if (!player.useMana(this.specialManaCost)) return;
    const common = {
      x: player.x + player.width + 35,
      y: player.y + 32,
      vx: 760, vy: 0, owner: "player", lifetime: 4,
    };

    if (player.character === "bear") {
      player.damageBuffTimer = 20;
      player.damageBuff = 1.25;
      player.buffFlash = 1.2;
    } else if (player.character === "rabbit") {
      projectiles.push(new Projectile({
        ...common, damage: 210, color: "#fff4df",
        type: "giant-carrot", width: 145, height: 115,
        statusEffect: "stun", statusDuration: 3,
      }));
    } else {
      projectiles.push(new Projectile({
        ...common, x: 755, y: 65, vx: 0, vy: 650,
        damage: 260, color: "#8ff5ff", radius: 45,
        type: "meteor-core", width: 145, height: 120,
        statusEffect: "silence", statusDuration: 3,
        lifetime: 2.5,
      }));
    }
    this.specialCooldown = 3;
  }
}
