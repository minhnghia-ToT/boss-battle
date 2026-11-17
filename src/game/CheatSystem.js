import SecretAlly from "./SecretAlly";

export default class CheatSystem {
  constructor() {
    this.unlocked = false;
    this.secretAlly = null;
    this.comboWasDown = false;
  }

  update(keys) {
    const comboDown = keys.has("m") && keys.has("n");
    const activated = comboDown && !this.comboWasDown && !this.unlocked;
    this.comboWasDown = comboDown;

    if (activated) {
      this.unlocked = true;
      this.secretAlly = new SecretAlly();
    }
    return activated;
  }

  draw(ctx) {
    if (this.secretAlly?.active) this.secretAlly.draw(ctx);
  }
}
