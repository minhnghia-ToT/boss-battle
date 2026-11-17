export default class Projectile {
  constructor({
    x, y, vx, vy = 0, damage = 10, owner = "player",
    color = "#55c5df", radius = 7, type = "normal",
    width, height, lifetime = 7, statusEffect = null, statusDuration = 0, bleeding = false,
  }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.owner = owner;
    this.color = color;
    this.radius = radius;
    this.type = type;
    this.width = width || radius * 2;
    this.height = height || radius * 2;
    this.lifetime = lifetime;
    this.active = true;
    this.animationTime = 0;
    this.statusEffect = statusEffect;
    this.statusDuration = statusDuration;
    this.bleeding = bleeding;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.animationTime += deltaTime;
    this.lifetime -= deltaTime;

    if (
      this.lifetime <= 0 ||
      this.x < -240 || this.x > 1220 ||
      this.y < -220 || this.y > 760
    ) this.active = false;
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();

    if (this.owner === "boss") {
      const pulse = 1 + Math.sin(this.animationTime * 12) * 0.12;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.type === "boss-laser" ? 24 : 12;

      if (this.type === "boss-laser") {
        ctx.fillStyle = "rgba(255,55,75,0.22)";
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - 4, this.width, 8);
        ctx.fillStyle = "#fff0e9";
        ctx.fillRect(this.x - this.width / 2, this.y - 1, this.width, 2);
      } else if (this.type === "ground-wave") {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x - 30, this.y + 18);
        ctx.lineTo(this.x - 15, this.y - 18);
        ctx.lineTo(this.x + 4, this.y + 18);
        ctx.lineTo(this.x + 24, this.y - 12);
        ctx.lineTo(this.x + 35, this.y + 18);
        ctx.closePath();
        ctx.fill();
      } else if (this.type === "spike") {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffe3df";
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
      }
      ctx.restore();
      return;
    }

    if (this.type === "sword-wave") {
      ctx.shadowColor = "#6beaff";
      ctx.shadowBlur = 18;
      ctx.translate(this.x, this.y);
      ctx.rotate(-0.12);
      ctx.fillStyle = "rgba(82,220,255,0.22)";
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height * 2);
      ctx.fillStyle = "#62e7ff";
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, 0);
      ctx.lineTo(this.width / 2, -this.height / 2);
      ctx.lineTo(this.width / 2 - 15, 0);
      ctx.lineTo(this.width / 2, this.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f1ffff";
      ctx.fillRect(-this.width / 3, -2, this.width * 0.65, 4);
    } else if (this.type === "absolute-zero") {
      ctx.shadowColor = "#66eaff";
      ctx.shadowBlur = 30;
      ctx.translate(this.x, this.y);
      ctx.fillStyle = "rgba(98,231,255,0.2)";
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.fillStyle = "#54dfff";
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, 0);
      ctx.lineTo(this.width / 2, -this.height / 2);
      ctx.lineTo(this.width / 2 - 28, 0);
      ctx.lineTo(this.width / 2, this.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f3ffff";
      ctx.fillRect(-this.width / 2 + 18, -5, this.width - 50, 10);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 ? "#b9f8ff" : "#ffffff";
        ctx.fillRect(-this.width / 2 + i * 24, -this.height / 2 - 9, 5, 5);
      }
    } else if (this.type === "giant-carrot") {
      ctx.translate(this.x, this.y);
      ctx.rotate(-0.12);
      ctx.shadowColor = "#ff9c35";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "#f58a24";
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, -this.height / 2);
      ctx.lineTo(this.width / 2, 0);
      ctx.lineTo(-this.width / 2, this.height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffbd55";
      ctx.fillRect(-this.width / 2 + 8, -8, this.width * 0.55, 7);
      ctx.fillStyle = "#48bd58";
      ctx.fillRect(-this.width / 2 - 5, -this.height / 2 - 12, 22, 18);
      ctx.fillRect(-this.width / 2 + 5, -this.height / 2 - 19, 12, 20);
    } else if (this.type === "moon-slash") {
      ctx.translate(this.x, this.y);
      ctx.shadowColor = "#8cefff";
      ctx.shadowBlur = 24;
      ctx.strokeStyle = "#b9f8ff";
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, -1.1, 1.1);
      ctx.stroke();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, -1.1, 1.1);
      ctx.stroke();
    } else if (this.type === "spell-star") {
      ctx.translate(this.x, this.y);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -15); ctx.lineTo(6, -5); ctx.lineTo(17, 0);
      ctx.lineTo(6, 5); ctx.lineTo(0, 15); ctx.lineTo(-6, 5);
      ctx.lineTo(-17, 0); ctx.lineTo(-6, -5); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-3, -3, 6, 6);
    } else if (this.type === "spell-rabbit") {
      ctx.translate(this.x, this.y);
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 13;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9ceeff";
      ctx.fillRect(-8, -2, 15, 4);
      ctx.fillRect(5, -10, 4, 8);
    } else if (this.type === "spell-bear" || this.type === "meteor-core") {
      ctx.translate(this.x, this.y);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.type === "meteor-core" ? 28 : 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff0c8";
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = "rgba(255,180,95,0.5)";
      ctx.fillRect(-this.width / 2, -5, this.width / 2, 10);
    } else if (this.type === "starburst" || this.type === "moon-rush") {
      ctx.translate(this.x, this.y);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, 0);
      ctx.quadraticCurveTo(0, -this.height, this.width / 2, 0);
      ctx.quadraticCurveTo(0, this.height * 0.55, -this.width / 2, 0);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-this.width / 3, -3, this.width * 0.65, 6);
    } else {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }

    ctx.restore();
  }
}
