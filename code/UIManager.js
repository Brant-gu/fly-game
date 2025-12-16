/* jshint esversion: 6 */
// @ts-check

export class UIManager {
  constructor() {
    /** @type {HTMLElement|null} */
    this.hudScore = document.getElementById("hud-score");
    /** @type {HTMLElement|null} */
    this.hudTime = document.getElementById("hud-time");
    /** @type {HTMLElement|null} */
    this.hudBoost = document.getElementById("hud-boost");
    /** @type {HTMLElement|null} */
    this.hudCombo = document.getElementById("hud-combo"); // Optional: if you have a combo display

    /** Stage-related HUD elements */
    /** @type {HTMLElement|null} */
    this.hudPhase = document.getElementById("hud-phase");
    /** @type {HTMLElement|null} */
    this.hudTarget = document.getElementById("hud-target");
    /** @type {HTMLElement|null} */
    this.hudElapsed = document.getElementById("hud-elapsed");
    /** @type {HTMLElement|null} */
    this.hudPhaseTime = document.getElementById("hud-phase-time");

    /** Menu and replay panels */
    /** @type {HTMLElement|null} */
    this.menuOverlay = document.getElementById("menu-overlay");
    /** @type {HTMLElement|null} */
    this.replayOverlay = document.getElementById("replay-overlay");
    /** @type {HTMLElement|null} */
    this.replayScoreLabel = document.getElementById("replay-score");
    /** @type {HTMLElement|null} */
    this.replayPhaseLabel = document.getElementById("replay-phase");
    /** @type {HTMLElement|null} */
    this.replayDurationLabel = document.getElementById("replay-duration");
    /** @type {HTMLButtonElement|null} */
    this.replayButton =
      /** @type {HTMLButtonElement|null} */ (
        document.getElementById("replay-button")
      );
  }

  /**
   * Bind difficulty selection buttons
   * @param {(level:string)=>void} onSelect
   */
  bindDifficultyButtons(onSelect) {
    /** @type {NodeListOf<HTMLButtonElement>} */
    const buttons = document.querySelectorAll(".menu-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const level = btn.dataset.difficulty || "hard";
        onSelect(level);
      });
    });
  }

  hideMenu() {
    if (this.menuOverlay) this.menuOverlay.style.display = "none";
  }

  /**
   * Format seconds to M:SS (used for total or elapsed time)
   * @param {number} sec
   */
  formatMMSS(sec) {
    const s = Math.max(0, sec);
    const m = Math.floor(s / 60);
    const rest = Math.floor(s % 60);
    const ss = rest.toString().padStart(2, "0");
    return m.toString() + ":" + ss;
  }

  /**
   * Update HUD numbers
   * @param {number} score
   * @param {number} timeRemaining current energy time (0~60)
   * @param {number} boostRemaining remaining boost time
   * @param {number} comboCount current combo count
   * @param {number} phase current phase 1/2/3
   * @param {number} phaseTarget current phase target score
   * @param {number} elapsedTime total elapsed time
   * @param {number} phaseTimeRemaining current phase time remaining
   */
  updateHUD(
    score,
    timeRemaining,
    boostRemaining,
    comboCount,
    phase,
    phaseTarget,
    elapsedTime,
    phaseTimeRemaining
  ) {
    // first line
    if (this.hudScore) {
      this.hudScore.textContent = score.toString();
    }
    if (this.hudTime) {
      this.hudTime.textContent =
        Math.max(0, timeRemaining).toFixed(1) + " s";
    }
    if (this.hudBoost) {
      this.hudBoost.textContent =
        Math.max(0, boostRemaining).toFixed(1) + " s";
    }

    // combo (if you have the corresponding DOM)
    if (this.hudCombo) {
      if (comboCount > 1) {
        this.hudCombo.textContent = "x" + comboCount;
        this.hudCombo.style.opacity = "1";
      } else {
        this.hudCombo.textContent = "";
        this.hudCombo.style.opacity = "0";
      }
    }

    // second line: phase + target + total time + phase remaining time
    if (this.hudPhase) {
      this.hudPhase.textContent =
        phase != null ? phase.toString() : "-";
    }
    if (this.hudTarget) {
      this.hudTarget.textContent =
        phaseTarget != null ? phaseTarget.toString() : "-";
    }
    if (this.hudElapsed) {
      this.hudElapsed.textContent = this.formatMMSS(elapsedTime);
    }
    if (this.hudPhaseTime) {
      this.hudPhaseTime.textContent =
        Math.max(0, phaseTimeRemaining).toFixed(1) + " s";
    }
  }

  /**
   * Game Over screen
   * @param {number} score
   * @param {number} phase
   * @param {number} elapsedTime
   */
  showGameOver(score, phase, elapsedTime) {
    if (this.replayOverlay) this.replayOverlay.style.display = "flex";

    if (this.replayScoreLabel) {
      this.replayScoreLabel.textContent =
        "Score: " + score.toString();
    }
    if (this.replayPhaseLabel) {
      this.replayPhaseLabel.textContent =
        "Phase: " + (phase != null ? phase.toString() : "-");
    }
    if (this.replayDurationLabel) {
      this.replayDurationLabel.textContent =
        "Total Time: " + this.formatMMSS(elapsedTime);
    }
  }

  /**
   * Bind replay button
   * @param {()=>void} onReplay
   */
  bindReplay(onReplay) {
    if (this.replayButton) {
      this.replayButton.addEventListener("click", onReplay);
    }
  }
}
