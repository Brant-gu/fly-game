/* jshint esversion: 6 */
// @ts-check

export class AudioManager {
  constructor() {
    this.collectSound = this._createAudio("./audio/collect.wav", 0.7);
    this.boostSound   = this._createAudio("./audio/boost.wav", 0.7);
    this.gameOverSound= this._createAudio("./audio/game_over.wav", 0.9);
    this.comboSound   = this._createAudio("./audio/combo.wav", 0.6);

    this.music        = this._createAudio("./audio/bg_music.mp3", 0.45, true);

    this.musicStarted = false;
  }

  /**
   * @param {string} src 
   * @param {number} volume 
   * @param {boolean} [loop]
   */
  _createAudio(src, volume, loop = false) {
    const a = new Audio(src);
    a.volume = volume;
    a.loop = loop;
    return a;
  }

  _safePlay(a) {
    if (!a) return;
    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) {
        p.catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  }

  startMusic() {
    if (this.music && !this.musicStarted) {
      this.musicStarted = true;
      this._safePlay(this.music);
    }
  }

  playCollect() {
    this._safePlay(this.collectSound);
  }

  playBoostStart() {
    this._safePlay(this.boostSound);
  }

  playGameOver() {
    this._safePlay(this.gameOverSound);
  }

  /**
   * Higher combo makes sound trigger more pronounced (optional)
   * @param {number} comboCount 
   */
  playCombo(comboCount) {
    if (comboCount >= 3) {
      this._safePlay(this.comboSound);
    }
  }
}
