
import Projectile from "./Projectile";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default class SecretAlly {
  constructor() {
    this.x = 250;
    this.y = 235;
    this.width = 112;
    this.height = 158;
    this.speed = 390;

    this.maxHP = 520;
    this.hp = this.maxHP;
    this.maxMana = 100;
    this.mana = 35;

    this.normalCooldown = 0;
    this.specialCooldown = 0;
    this.invulnerable = 0;
    this.animationTime = 0;
    this.attackTime = 0;
    this.isMoving = false;
    this.active = true;
    this.facing = 1;
  }

  update(keys, deltaTime) {
    if (!this.active) return;

    let dx = 0;
    let dy = 0;

    if (keys.has("a") || keys.has("arrowleft")) dx--;
    if (keys.has("d") || keys.has("arrowright")) dx++;
    if (keys.has("w") || keys.has("arrowup")) dy--;
    if (keys.has("s") || keys.has("arrowdown")) dy++;

    const length = Math.hypot(dx, dy);

    if (length > 0) {
      dx /= length;
      dy /= length;

      if (dx !== 0) {
        this.facing = dx > 0 ? 1 : -1;
      }
    }

    this.isMoving = length > 0;

    this.x = clamp(
      this.x + dx * this.speed * deltaTime,
      28,
      690
    );

    this.y = clamp(
      this.y + dy * this.speed * deltaTime,
      92,
      345
    );

    this.normalCooldown = Math.max(
      0,
      this.normalCooldown - deltaTime
    );

    this.specialCooldown = Math.max(
      0,
      this.specialCooldown - deltaTime
    );

    this.invulnerable = Math.max(
      0,
      this.invulnerable - deltaTime
    );

    // Năng lượng của Người bí ẩn hồi rất chậm, kể cả khi giữ E.
    this.mana = Math.min(
      this.maxMana,
      this.mana + 1.5 * deltaTime
    );

    this.animationTime += deltaTime;
    this.attackTime = Math.max(
      0,
      this.attackTime - deltaTime
    );
  }

  getHitbox() {
    return {
      x: this.x + 25,
      y: this.y + 25,
      width: 62,
      height: 118,
    };
  }

  takeDamage(damage) {
    if (this.invulnerable > 0 || !this.active) {
      return false;
    }

    this.hp = Math.max(0, this.hp - damage);
    this.invulnerable = 0.65;

    if (this.hp <= 0) {
      this.active = false;
    }

    return true;
  }

  handleInput(keys, projectiles) {
    if (!this.active) return;

    const specialPressed = keys.has("q") && keys.has("e");

    // Ultimate: multi-hit crescent slashes + three allies' finishing moves.
    if (specialPressed && this.specialCooldown <= 0 && this.mana >= 100) {
      this.mana = 0;
      this.specialCooldown = 12;
      this.attackTime = 1.1;

      for (let i = 0; i < 5; i++) {
        projectiles.push(new Projectile({
          x: this.x + 100 * this.facing,
          y: this.y + 38 + i * 18,
          vx: 760 * this.facing,
          vy: (i - 2) * 42,
          damage: 105,
          owner: "secret",
          color: i % 2 ? "#8cefff" : "#e4ffff",
          radius: 24,
          type: "moon-slash",
          width: 125,
          height: 90,
          lifetime: 2.5,
          statusEffect: i === 0 ? "fear" : null,
          statusDuration: 4,
        }));
      }

      // Summoned allies deal damage only; no stun/silence/buff effects.
      const summons = [
        { damage: 210, color: "#fff4df", type: "giant-carrot", width: 105, height: 75, y: 360 },
        { damage: 260, color: "#8ff5ff", type: "meteor-core", width: 115, height: 95, y: 80 },
        { damage: 340, color: "#ffbd72", type: "meteor-core", width: 125, height: 105, y: 280 },
      ];

      summons.forEach((skill, index) => {
        projectiles.push(new Projectile({
          x: 755 + index * 18,
          y: skill.y,
          vx: 0,
          vy: index === 1 ? 570 : 0,
          damage: skill.damage,
          owner: "secret",
          color: skill.color,
          radius: 35,
          type: skill.type,
          width: skill.width,
          height: skill.height,
          lifetime: 3,
        }));
      });
      return;
    }

    // Normal attack: crescent-shaped sword wave.
    if (keys.has("q") && !keys.has("e") && this.normalCooldown <= 0) {
      this.normalCooldown = 0.42;
      this.attackTime = 0.3;
      projectiles.push(new Projectile({
        x: this.x + 88 * this.facing,
        y: this.y + 74,
        vx: 920 * this.facing,
        vy: 0,
        damage: 175,
        owner: "secret",
        color: "#78eaff",
        radius: 22,
        type: "moon-slash",
        width: 92,
        height: 62,
        lifetime: 2,
      }));
    }
  }

  pixel(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      w,
      h
    );
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    if (
      this.invulnerable > 0 &&
      Math.floor(this.animationTime * 16) % 2 === 0
    ) {
      ctx.globalAlpha = 0.35;
    }

    const bob = this.isMoving
      ? Math.sin(this.animationTime * 13) * 3
      : Math.sin(this.animationTime * 3) * 4;

    const x = Math.round(this.x);
    const y = Math.round(this.y + bob);

    const p = (a, b, w, h, color) =>
      this.pixel(ctx, x + a, y + b, w, h, color);

    // Aura và bóng.
    ctx.fillStyle = "rgba(80, 213, 255, 0.10)";
    ctx.beginPath();
    ctx.ellipse(
      x + 55,
      y + 148,
      54,
      10,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Thanh kiếm băng khổng lồ.
    ctx.save();
    ctx.translate(x + 54, y + 58);
    ctx.rotate(-0.73);

    const swordPixel = (sx, sy, sw, sh, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy, sw, sh);
    };

    swordPixel(-7, -105, 18, 124, "#8cefff");
    swordPixel(-3, -119, 10, 120, "#e4ffff");
    swordPixel(-14, -89, 7, 84, "#43cde9");
    swordPixel(7, -91, 7, 87, "#b7f7ff");
    swordPixel(-3, -130, 10, 18, "#f4ffff");
    swordPixel(-18, 5, 40, 9, "#26384a");
    swordPixel(-5, 13, 12, 23, "#9b754e");

    ctx.restore();

    // Quần và tà áo.
    p(17, 91, 27, 54, "#090a12");
    p(62, 91, 28, 54, "#0a0b13");
    p(9, 126, 39, 15, "#05060b");
    p(59, 126, 40, 15, "#05060b");
    p(8, 139, 39, 9, "#05060a");
    p(59, 139, 42, 9, "#05060a");

    // Áo khoác đen.
    p(12, 52, 87, 67, "#080910");
    p(4, 75, 23, 61, "#0a0b13");
    p(81, 73, 25, 62, "#090a12");
    p(1, 112, 25, 31, "#080910");
    p(83, 111, 27, 32, "#080910");
    p(23, 48, 65, 80, "#11131d");
    p(31, 55, 49, 65, "#090b13");

    // Áo sơ mi trắng.
    p(37, 57, 37, 62, "#d9e2ec");
    p(40, 61, 30, 49, "#f1f4f8");
    p(39, 84, 33, 7, "#9ca9ba");
    p(43, 103, 24, 6, "#aeb8c7");

    // Cổ và khuôn mặt.
    p(47, 37, 19, 23, "#dcae98");
    p(33, 13, 48, 44, "#080910");
    p(39, 20, 37, 40, "#e8bda9");
    p(35, 39, 10, 12, "#d9a38f");
    p(72, 38, 10, 12, "#d9a38f");
    p(43, 44, 8, 4, "#382b32");
    p(64, 44, 8, 4, "#382b32");
    p(54, 49, 10, 3, "#9a5d60");

    // Tóc đen nhiều lớp.
    p(22, 10, 67, 28, "#05060b");
    p(28, 1, 52, 22, "#080910");
    p(16, 20, 26, 22, "#080910");
    p(74, 15, 24, 19, "#05060a");
    p(30, 30, 15, 20, "#07080e");
    p(43, 28, 13, 18, "#05060b");
    p(58, 29, 12, 17, "#07080e");
    p(72, 27, 13, 15, "#080910");
    p(24, 8, 12, 17, "#111521");
    p(48, 4, 13, 11, "#111521");
    p(70, 8, 10, 10, "#121522");

    // Hai cánh tay.
    p(9, 59, 20, 49, "#11131d");
    p(83, 58, 20, 43, "#11131d");
    p(91, 83, 20, 13, "#dcae98");
    p(99, 76, 12, 12, "#e5b9a2");
    p(17, 94, 12, 16, "#dcae98");

    // Chi tiết áo khoác.
    p(29, 54, 10, 46, "#252b3a");
    p(72, 54, 9, 43, "#242a39");
    p(34, 59, 5, 27, "#71849a");
    p(73, 62, 4, 25, "#667c95");

    // Hiệu ứng chém.
    if (this.attackTime > 0) {
      ctx.globalAlpha = Math.min(
        0.8,
        this.attackTime * 2
      );

      ctx.strokeStyle = "#a9f5ff";
      ctx.lineWidth = 8;
      ctx.shadowColor = "#54dfff";
      ctx.shadowBlur = 22;

      ctx.beginPath();
      ctx.arc(
        x + 92 * this.facing,
        y + 66,
        62,
        this.facing === 1 ? -1.1 : Math.PI - 0.55,
        this.facing === 1 ? 0.55 : Math.PI + 1.1
      );
      ctx.stroke();
    }

    ctx.restore();
  }
}
