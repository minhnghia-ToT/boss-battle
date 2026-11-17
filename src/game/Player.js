
const CONFIG = {
  star: {
    name: "STAR",
    speed: 250,
    damage: 14,
    jumpPower: 590,
    color: "#54d9ee",
  },
  rabbit: {
    name: "RABBIT",
    speed: 290,
    damage: 11,
    jumpPower: 650,
    color: "#f4eee8",
  },
  bear: {
    name: "BEAR",
    speed: 210,
    damage: 19,
    jumpPower: 540,
    color: "#c78b54",
  },
};

export default class Player {
  constructor(character = "star") {
    this.character = CONFIG[character] ? character : "star";
    this.config = CONFIG[this.character];

    this.x = 120;
    this.y = 380;

    this.width = 58;
    this.height = 65;
    this.groundY = 380;

    this.velocityY = 0;
    this.gravity = 1500;
    this.jumpPower = this.config.jumpPower;

    this.isGrounded = true;
    this.isCrouching = false;
    this.isMoving = false;

    this.maxHP = 100;
    this.hp = 100;

    this.maxMana = 100;
    this.mana = 0;

    this.speed = this.config.speed;
    this.damage = this.config.damage;

    this.invulnerable = 0;
    this.animationTime = 0;
    this.damageBuffTimer = 0;
    this.damageBuff = 1;
    this.buffFlash = 0;
    this.bleedTimer = 0;
    this.bleedTick = 0;
  }

  update(keys, deltaTime) {
    let movement = 0;

    if (keys.has("a") || keys.has("arrowleft")) {
      movement--;
    }

    if (keys.has("d") || keys.has("arrowright")) {
      movement++;
    }

    this.isMoving = movement !== 0;

    this.x += movement * this.speed * deltaTime;
    this.x = Math.max(30, Math.min(430, this.x));

    // Ngồi xuống
    this.isCrouching =
      this.isGrounded &&
      (keys.has("s") || keys.has("arrowdown"));

    // Nhảy
    const jumpPressed =
      keys.has(" ") ||
      keys.has("w") ||
      keys.has("arrowup");

    if (jumpPressed && this.isGrounded) {
      this.velocityY = -this.jumpPower;
      this.isGrounded = false;
      this.isCrouching = false;
    }

    // Trọng lực
    if (!this.isGrounded) {
      this.velocityY += this.gravity * deltaTime;
      this.y += this.velocityY * deltaTime;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }

    this.mana = Math.min(
      this.maxMana,
      this.mana + 7 * deltaTime
    );

    this.invulnerable = Math.max(
      0,
      this.invulnerable - deltaTime
    );

    this.damageBuffTimer = Math.max(0, this.damageBuffTimer - deltaTime);
    if (this.damageBuffTimer <= 0) this.damageBuff = 1;
    this.buffFlash = Math.max(0, this.buffFlash - deltaTime);
    if (this.bleedTimer > 0) {
      this.bleedTimer = Math.max(0, this.bleedTimer - deltaTime);
      this.bleedTick += deltaTime;
      if (this.bleedTick >= 1) {
        this.hp = Math.max(0, this.hp - 4);
        this.bleedTick -= 1;
      }
    }
    this.animationTime += deltaTime;
  }

  getHitbox() {
    if (this.isCrouching) {
      return {
        x: this.x + 8,
        y: this.y + 35,
        width: 42,
        height: 28,
      };
    }

    return {
      x: this.x + 8,
      y: this.y + 5,
      width: 42,
      height: 55,
    };
  }

  takeDamage(damage) {
    if (this.invulnerable > 0 || this.hp <= 0) {
      return false;
    }

    this.hp = Math.max(0, this.hp - damage);
    this.invulnerable = 0.8;

    return true;
  }

  addMana(amount) {
    this.mana = Math.min(
      this.maxMana,
      this.mana + amount
    );
  }

  useMana(amount) {
    if (this.mana < amount) return false;

    this.mana -= amount;
    return true;
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
    ctx.save();

    if (
      this.invulnerable > 0 &&
      Math.floor(this.animationTime * 12) % 2 === 0
    ) {
      ctx.globalAlpha = 0.35;
    }

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    // Bóng
    const shadow = Math.max(
      0.4,
      1 - (this.groundY - this.y) / 180
    );

    this.pixel(
      ctx,
      x + 8,
      this.groundY + 62,
      Math.round(42 * shadow),
      5,
      "rgba(0,0,0,0.4)"
    );

    if (this.isCrouching) {
      this.drawCrouching(ctx, x, y);
    } else if (this.character === "star") {
      this.drawStar(ctx, x, y);
    } else if (this.character === "rabbit") {
      this.drawRabbit(ctx, x, y);
    } else {
      this.drawBear(ctx, x, y);
    }

    if (this.damageBuffTimer > 0) {
      ctx.globalAlpha = 0.28 + Math.sin(this.animationTime * 12) * 0.1;
      ctx.fillStyle = "#ffc45c";
      ctx.beginPath();
      ctx.arc(x + 29, y + 31, 43, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawStar(ctx, x, y) {
    const p = (a, b, w, h, c) =>
      this.pixel(ctx, x + a, y + b, w, h, c);

    const bob = this.isMoving
      ? Math.round(Math.sin(this.animationTime * 12) * 2)
      : 0;

    // Chân
    p(10, 57 + bob, 15, 7, "#26364b");
    p(34, 57 - bob, 15, 7, "#26364b");

    // Áo choàng
    p(8, 31, 43, 25, "#237c9c");
    p(14, 27, 32, 30, "#55c5df");
    p(18, 35, 24, 18, "#d8faff");

    // Cổ
    p(22, 23, 15, 9, "#f2c4a8");

    // Đầu ngôi sao
    p(17, 8, 25, 23, "#42b9d7");
    p(21, 2, 17, 12, "#8cf0ff");
    p(9, 14, 14, 14, "#55c5df");
    p(38, 14, 14, 14, "#55c5df");
    p(15, 25, 12, 9, "#55c5df");
    p(33, 25, 12, 9, "#55c5df");

    // Mắt
    p(22, 17, 4, 6, "#17334b");
    p(35, 17, 4, 6, "#17334b");

    // Miệng
    p(28, 26, 7, 2, "#f3a7b4");

    // Ngôi sao trên ngực
    p(26, 38, 7, 8, "#fff3a6");
  }

  drawRabbit(ctx, x, y) {
    const p = (a, b, w, h, c) =>
      this.pixel(ctx, x + a, y + b, w, h, c);

    const bob = this.isMoving
      ? Math.round(Math.sin(this.animationTime * 12) * 2)
      : 0;

    // Tai
    p(12, -12, 11, 27, "#e8ddd8");
    p(35, -12, 11, 27, "#e8ddd8");

    p(16, -8, 4, 18, "#e89bab");
    p(38, -8, 4, 18, "#e89bab");

    // Chân
    p(8, 57 + bob, 18, 8, "#e8ddd8");
    p(33, 57 - bob, 18, 8, "#e8ddd8");

    // Thân
    p(11, 32, 37, 27, "#dce9ec");
    p(16, 37, 27, 19, "#ffffff");

    // Khăn cổ
    p(17, 30, 26, 6, "#69b8cf");

    // Đầu
    p(8, 10, 42, 32, "#f3eae5");
    p(13, 5, 32, 37, "#ffffff");

    // Má
    p(11, 29, 7, 5, "#f4b5bb");
    p(41, 29, 7, 5, "#f4b5bb");

    // Mắt
    p(18, 22, 5, 7, "#263b58");
    p(36, 22, 5, 7, "#263b58");

    // Mũi
    p(27, 31, 6, 5, "#dd8295");
  }

  drawBear(ctx, x, y) {
    const p = (a, b, w, h, c) =>
      this.pixel(ctx, x + a, y + b, w, h, c);

    const bob = this.isMoving
      ? Math.round(Math.sin(this.animationTime * 12) * 2)
      : 0;

    // Tai
    p(5, 8, 16, 16, "#9e6944");
    p(38, 8, 16, 16, "#9e6944");
    p(10, 12, 7, 7, "#e6a18a");
    p(42, 12, 7, 7, "#e6a18a");

    // Chân
    p(8, 57 + bob, 19, 8, "#67452f");
    p(34, 57 - bob, 19, 8, "#67452f");

    // Thân
    p(7, 31, 45, 28, "#9d6944");
    p(13, 34, 34, 21, "#c68a53");

    // Áo sọc
    p(10, 38, 39, 6, "#315f83");
    p(10, 48, 39, 6, "#315f83");

    // Đầu
    p(8, 7, 43, 35, "#c78b54");
    p(13, 3, 33, 41, "#d5a16d");

    // Mõm
    p(22, 27, 20, 10, "#f0d0ac");

    // Mắt
    p(18, 20, 5, 7, "#24202a");
    p(38, 20, 5, 7, "#24202a");

    // Mũi
    p(29, 29, 7, 5, "#35202b");
  }

  drawCrouching(ctx, x, y) {
    const p = (a, b, w, h, c) =>
      this.pixel(ctx, x + a, y + b, w, h, c);

    // Tư thế ngồi thấp
    p(7, 42, 45, 15, this.config.color);
    p(11, 52, 18, 9, "#25283b");
    p(33, 52, 18, 9, "#25283b");

    if (this.character === "star") {
      p(13, 20, 34, 24, "#55c5df");
      p(17, 7, 26, 20, "#42b9d7");
      p(20, 14, 5, 6, "#17334b");
      p(36, 14, 5, 6, "#17334b");
      p(26, 28, 8, 7, "#fff3a6");
    }

    if (this.character === "rabbit") {
      p(14, -10, 10, 29, "#e8ddd8");
      p(36, -10, 10, 29, "#e8ddd8");
      p(10, 14, 40, 32, "#ffffff");
      p(19, 27, 5, 6, "#263b58");
      p(37, 27, 5, 6, "#263b58");
      p(28, 35, 6, 5, "#dd8295");
    }

    if (this.character === "bear") {
      p(8, 15, 43, 34, "#c78b54");
      p(12, 38, 36, 6, "#315f83");
      p(19, 28, 5, 6, "#24202a");
      p(37, 28, 5, 6, "#24202a");
    }
  }
}
