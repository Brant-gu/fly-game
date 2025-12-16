/* jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { AirRing, RingBurst } from "./AirRing.js";
import { TimeOrb } from "./TimeOrb.js";

/**
 * Short-lived red laser beam effect: from start to end, fades quickly
 */
class LaserBeamEffect {
  /**
   * @param {T.Vector3} start 
   * @param {T.Vector3} end 
   */
  constructor(start, end) {
    const dir = new T.Vector3().subVectors(end, start);
    const length = dir.length() || 0.001;

    const radius = 0.08;
    const geom = new T.CylinderGeometry(radius, radius, length, 8);

    const mat = new T.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff0000,
      emissiveIntensity: 2.8,
      metalness: 0.3,
      roughness: 0.18,
      transparent: true,
      opacity: 0.95
    });

    const mesh = new T.Mesh(geom, mat);

    // Cylinder defaults along Y axis; place at midpoint, then orient toward dir
    const mid = new T.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mesh.position.copy(mid);

    const up = new T.Vector3(0, 1, 0);
    dir.normalize();
    const quat = new T.Quaternion().setFromUnitVectors(up, dir);
    mesh.quaternion.copy(quat);

    this.group = new T.Group();
    this.group.add(mesh);

    /** @type {T.MeshStandardMaterial} */
    this.material = mat;

    this.age = 0;
    this.lifetime = 0.18;
    this.done = false;
  }

  /**
   * @param {T.Scene} scene 
   */
  addToScene(scene) {
    scene.add(this.group);
  }

  /**
   * @param {number} delta 
   */
  update(delta) {
    this.age += delta;
    const t = this.age / this.lifetime;
    const alpha = Math.max(0, 1 - t);

    this.material.opacity = alpha;
    this.material.emissiveIntensity = 2.8 * alpha;

    const scaleY = 1 + 0.35 * t;
    this.group.scale.set(1, scaleY, 1);

    if (this.age >= this.lifetime) {
      this.done = true;
    }
  }

  /**
   * @param {T.Scene} scene 
   */
  removeFromScene(scene) {
    scene.remove(this.group);
  }
}

export class GameController {
  /**
   * @param {{
   *  scene: T.Scene,
   *  camera: T.PerspectiveCamera,
   *  player: any,
   *  ui?: import("./UIManager.js").UIManager,
   *  audio?: import("./AudioManager.js").AudioManager,
   *  baseSpeed?: number,
   *  regionX?: number,
   *  regionZ?: number,
   *  yMin?: number,
   *  yMax?: number
   * }} params 
   */
  constructor(params = {}) {
    this.scene = params.scene;
    this.camera = params.camera;
    this.player = params.player;

    this.ui = params.ui;
    this.audio = params.audio;

    // Movement
    this.baseSpeed = params.baseSpeed || 30;
    this.currentSpeed = this.baseSpeed;
    this.boostMultiplier = 2.0;
    this.boostMax = 5;
    this.boostRemaining = this.boostMax;
    this.turnSpeed = 3.0;
    this.pitchSpeed = 2.2;
    this.wasBoostingLastFrame = false;

    /** @type {Record<string, boolean>} */
    this.keys = {};

    // World bounds
    this.regionX = params.regionX || 60;
    this.regionZ = params.regionZ || 60;
    this.yMin = params.yMin || 3;
    this.yMax = params.yMax || 25;

    /** Obstacles in the scene (buildings, etc.), represented with horizontal circular colliders */
    /** @type {{object: T.Object3D, radius: number}[]} */
    this.obstacles = [];

    // Rings
    this.rings = [];
    this.ringInnerRadius = 4.0;
    this.ringTubeRadius = 0.8;
    this.collectRadius = this.ringInnerRadius + this.ringTubeRadius * 0.5;

    this.spawnTimer = 0;
    this.spawnIntervalMin = 2;
    this.spawnIntervalMax = 4;

    // Time orbs
    this.timeOrbs = [];
    this.orbSpawnTimer = 0;
    this.orbSpawnIntervalMin = 5;
    this.orbSpawnIntervalMax = 9;

    // Score & time
    this.score = 0;
    this.levelDuration = 60;
    this.timeRemaining = this.levelDuration;
    this.maxTime = 100; // maximum energy time cap (orb time won't exceed this)

    // Three-phase score thresholds (phaseTargets[1..3] used)
    this.elapsedTime = 0;
    this.phase = 1;
    this.phaseTargets = [0, 15, 30, 45];
    this.phase1Checked = false;
    this.phase2Checked = false;
    this.phase3Checked = false;

    // Combo
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboWindow = 3.0;

    /** @type {"WAITING"|"PLAYING"|"GAME_OVER"} */
    this.state = "WAITING";

    // All effects (RingBurst + LaserBeam)
    this.effects = [];

    // Camera pan (middle mouse)
    this.cameraPan = new T.Vector2(0, 0);
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;

    this.pointerLocked = false;

    // Keyboard events
    window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.code] = false));

    this.enableMouseLook();
  }
    /**
   * Register a spherical/cylindrical obstacle (appears circular in the XZ plane)
   * @param {T.Object3D} object root node of the obstacle
   * @param {number} radius collision radius (larger is harder to approach)
   */
  addObstacle(object, radius) {
    this.obstacles.push({ object, radius });
  }

  /**
   * Register buildings in bulk from a CyberTower as obstacles
   * @param {{ _buildings?: T.Object3D[] }} city CyberTower instance
   * @param {number} [radius] collision radius per building
   */
  registerCityObstacles(city, radius = 10) {
    if (!city || !Array.isArray(city._buildings)) return;
    for (const b of city._buildings) {
      this.addObstacle(b, radius);
    }
  }


  /**
   * End the game
   */
  endGame() {
    if (this.state === "GAME_OVER") return;
    this.state = "GAME_OVER";
    if (this.ui) {
      this.ui.showGameOver(this.score, this.phase, this.elapsedTime);
    }
    if (this.audio) {
      this.audio.playGameOver();
    }
  }

  /**
   * Called when selecting difficulty: adjust ring size and reset state
   * @param {"easy"|"normal"|"hard"} level 
   */
  setDifficulty(level) {
    this.difficulty = level;

    if (level === "easy") {
      this.ringInnerRadius = 8;
    } else if (level === "normal") {
      this.ringInnerRadius = 6;
    } else {
      this.ringInnerRadius = 4;
    }
    this.ringTubeRadius = this.ringInnerRadius * 0.2;
    this.collectRadius = this.ringInnerRadius + this.ringTubeRadius * 0.5;

    // reset time and score
    this.timeRemaining = this.levelDuration;
    this.score = 0;
    this.boostRemaining = this.boostMax;
    this.spawnTimer = 0;

    this.comboCount = 0;
    this.comboTimer = 0;

    // reset phase info
    this.elapsedTime = 0;
    this.phase = 1;
    this.phase1Checked = false;
    this.phase2Checked = false;
    this.phase3Checked = false;

    // clear Rings
    for (const r of this.rings) {
      if (r.objects && r.objects[0]) {
        this.scene.remove(r.objects[0]);
      }
    }
    this.rings = [];

    // clear TimeOrbs
    for (const orb of this.timeOrbs) {
      if (orb.objects && orb.objects[0]) {
        this.scene.remove(orb.objects[0]);
      }
    }
    this.timeOrbs = [];

    // clear effects
    for (const fx of this.effects) {
      fx.removeFromScene(this.scene);
    }
    this.effects = [];

    this.state = "PLAYING";
  }

  // ================================
  // Mouse controls (right-click lock, wheel adjusts FOV, middle-button pan)
  // ================================
  enableMouseLook() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    this.pointerLocked = false;

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 2) {
        e.preventDefault();
        canvas.requestPointerLock();
      } else if (e.button === 1 && !this.pointerLocked) {
        e.preventDefault();
        this.isPanning = true;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
      }
    });

    document.addEventListener("mouseup", (e) => {
      if (e.button === 1) this.isPanning = false;
    });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === canvas;
      if (!this.pointerLocked) {
        this.isPanning = false;
      }
    });

    document.addEventListener("mousemove", (e) => {
      const obj = this.player.objects[0];

      if (this.pointerLocked) {
        // left-right
        obj.rotation.y -= e.movementX * 0.002 * this.turnSpeed;
        // invert vertical: mouse up -> nose down
        obj.rotation.x += e.movementY * 0.002 * this.pitchSpeed;

        const maxPitch = 0.95;
        obj.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, obj.rotation.x));
      } else if (this.isPanning) {
        const dx = e.clientX - this.lastPanX;
        const dy = e.clientY - this.lastPanY;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;

        const PAN_SPEED = 0.015;
        this.cameraPan.x += -dx * PAN_SPEED;
        this.cameraPan.y += dy * PAN_SPEED;
      }
    });

    // wheel adjusts FOV
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const cam = this.camera;
        cam.fov += e.deltaY * 0.03;
        cam.fov = Math.max(40, Math.min(110, cam.fov));
        cam.updateProjectionMatrix();
      },
      { passive: false }
    );
  }

  // spawn a Ring
  spawnRing() {
    const x = (Math.random() * 2 - 1) * this.regionX;
    const z = (Math.random() * 2 - 1) * this.regionZ;
    const y = this.yMin + Math.random() * (this.yMax - this.yMin);

    const ring = new AirRing({
      x,
      y,
      z,
      innerRadius: this.ringInnerRadius,
      tubeRadius: this.ringTubeRadius,
      lifetime: 5
    });

    this.rings.push(ring);
    this.scene.add(ring.objects[0]);
  }

  // spawn a TimeOrb
  spawnTimeOrb() {
    const x = (Math.random() * 2 - 1) * this.regionX;
    const z = (Math.random() * 2 - 1) * this.regionZ;
    const y = this.yMin + Math.random() * (this.yMax - this.yMin);

    const orb = new TimeOrb({
      x,
      y,
      z,
      radius: 0.7,
      triggerRadius: 12,
      lifetime: 10
    });

    this.timeOrbs.push(orb);
    this.scene.add(orb.objects[0]);
  }

  /**
   * Remaining time for the current phase (counting down from 60/120/180)
   */
  getPhaseTimeRemaining() {
    const phaseIndex = this.phase; // 1,2,3
    const phaseEnd = phaseIndex * 60;
    return Math.max(0, phaseEnd - this.elapsedTime);
  }

  /**
   * Per-frame update
   * @param {number} delta 
   */
  update(delta) {
    // combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // When not PLAYING: only update effects/timeorb animations + camera + HUD
    if (this.state !== "PLAYING") {
      for (const orb of this.timeOrbs) {
        orb.update?.(delta);
      }
      this.cleanupTimeOrbs();

      this.updateEffects(delta);
      this.cleanupEffects();

      this.updateCamera();

      if (this.ui) {
        const phaseTarget = this.phaseTargets[this.phase] ?? 0;
        const phaseTimeRemaining = this.getPhaseTimeRemaining();
        this.ui.updateHUD(
          this.score,
          this.timeRemaining,
          this.boostRemaining,
          this.comboCount,
          this.phase,
          phaseTarget,
          this.elapsedTime,
          phaseTimeRemaining
        );
      }
      return;
    }

    // ================= Base time & phase control =================
    this.elapsedTime += delta;

    // Main countdown (affected by TimeOrbs)
    this.timeRemaining -= delta;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.endGame();
    }

    if (this.state !== "PLAYING") {
      if (this.ui) {
        const phaseTarget = this.phaseTargets[this.phase] ?? 0;
        const phaseTimeRemaining = this.getPhaseTimeRemaining();
        this.ui.updateHUD(
          this.score,
          this.timeRemaining,
          this.boostRemaining,
          this.comboCount,
          this.phase,
          phaseTarget,
          this.elapsedTime,
          phaseTimeRemaining
        );
      }
      return;
    }

    // Clamp timeRemaining to [0, maxTime]
    if (this.timeRemaining > this.maxTime) {
      this.timeRemaining = this.maxTime;
    }

    // Check three phase score thresholds by total elapsed time
    this.checkPhaseScoreRequirements();

    if (this.state !== "PLAYING") {
      if (this.ui) {
        const phaseTarget = this.phaseTargets[this.phase] ?? 0;
        const phaseTimeRemaining = this.getPhaseTimeRemaining();
        this.ui.updateHUD(
          this.score,
          this.timeRemaining,
          this.boostRemaining,
          this.comboCount,
          this.phase,
          phaseTarget,
          this.elapsedTime,
          phaseTimeRemaining
        );
      }
      return;
    }

    // ================= Player movement & scene objects =================
    this.updatePlayerMovement(delta);

    for (const r of this.rings) {
      r.update?.(delta);
    }
    for (const orb of this.timeOrbs) {
      orb.update?.(delta);
    }

    // Refresh/Spawn Rings
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0 && this.state === "PLAYING") {
      this.spawnTimer =
        this.spawnIntervalMin +
        Math.random() *
          (this.spawnIntervalMax - this.spawnIntervalMin);
      this.spawnRing();
    }

    // Refresh/Spawn TimeOrbs
    this.orbSpawnTimer -= delta;
    if (this.orbSpawnTimer <= 0 && this.state === "PLAYING") {
      this.orbSpawnTimer =
        this.orbSpawnIntervalMin +
        Math.random() *
          (this.orbSpawnIntervalMax -
            this.orbSpawnIntervalMin);
      this.spawnTimeOrb();
    }

    // collision
    this.checkRingCollisions();
    this.checkTimeOrbCollisions();

    // cleanup expired objects & effects
    this.cleanupRings();
    this.cleanupTimeOrbs();

    this.updateEffects(delta);
    this.cleanupEffects();

    // camera & HUD
    this.updateCamera();

    if (this.ui) {
      const phaseTarget = this.phaseTargets[this.phase] ?? 0;
      const phaseTimeRemaining = this.getPhaseTimeRemaining();
      this.ui.updateHUD(
        this.score,
        this.timeRemaining,
        this.boostRemaining,
        this.comboCount,
        this.phase,
        phaseTarget,
        this.elapsedTime,
        phaseTimeRemaining
      );
    }
  }

  /**
   * Check three phase score thresholds
   */
  checkPhaseScoreRequirements() {
    // Phase 1: at 60s >= 25
    if (!this.phase1Checked && this.elapsedTime >= 60) {
      this.phase1Checked = true;
      if (this.score < this.phaseTargets[1]) {
        this.endGame();
        return;
      }
      this.phase = 2;
    }

    // Phase 2: at 120s >= 60
    if (!this.phase2Checked && this.elapsedTime >= 120) {
      this.phase2Checked = true;
      if (this.score < this.phaseTargets[2]) {
        this.endGame();
        return;
      }
      this.phase = 3;
    }

    // Phase 3: at 180s >= 100 — if reached, level is cleared and the game ends
    if (!this.phase3Checked && this.elapsedTime >= 180) {
      this.phase3Checked = true;
      if (this.score < this.phaseTargets[3]) {
        this.endGame();
        return;
      }
      // level clear: end game immediately
      this.endGame();
    }
  }

  // player movement
    updatePlayerMovement(delta) {
    const obj = this.player.objects[0];

    // ========== 1. Boost logic (keep original behavior) ==========
    const isBoostPressed = this.keys["ShiftLeft"] || this.keys["ShiftRight"];
    if (isBoostPressed && this.boostRemaining > 0) {
      this.currentSpeed = this.baseSpeed * this.boostMultiplier;
      this.boostRemaining -= delta;
      if (this.boostRemaining < 0) this.boostRemaining = 0;

      if (!this.wasBoostingLastFrame && this.audio) {
        this.audio.playBoostStart();
      }
      this.wasBoostingLastFrame = true;
    } else {
      this.currentSpeed = this.baseSpeed;
      if (!isBoostPressed && this.boostRemaining < this.boostMax) {
        this.boostRemaining += delta * 0.4;
        if (this.boostRemaining > this.boostMax) this.boostRemaining = this.boostMax;
      }
      this.wasBoostingLastFrame = false;
    }

    // ========== 2. Direction: yaw + pitch ==========
    const yaw = (
      (this.keys["KeyA"] ? 1 : 0) +
      (this.keys["KeyD"] ? -1 : 0)
    ) * this.turnSpeed * delta;

    const pitch = (
      (this.keys["KeyW"] ? 1 : 0) +  // your current setting is inverted: W raises the nose
      (this.keys["KeyS"] ? -1 : 0)
    ) * this.pitchSpeed * delta;

    // yaw is on Y axis, pitch is on X axis
    obj.rotation.y += yaw;
    obj.rotation.x += pitch;

    // ========== 3. Compute desired position desiredPos ==========
    const forward = new T.Vector3(0, 0, -1)
      .applyQuaternion(obj.quaternion)
      .normalize();

    // copy current world position first
    const desiredPos = obj.position.clone();

    // forward / backward (actually only forward)
    desiredPos.addScaledVector(forward, this.currentSpeed * delta);

    // Q / E vertical movement
    if (this.keys["KeyQ"]) desiredPos.y += this.baseSpeed * 0.8 * delta;
    if (this.keys["KeyE"]) desiredPos.y -= this.baseSpeed * 0.8 * delta;

    // ========== 4. Height and boundary limits ==========
    if (desiredPos.y < this.yMin) desiredPos.y = this.yMin;
    if (desiredPos.y > this.yMax) desiredPos.y = this.yMax;

    if (desiredPos.x < -this.regionX) desiredPos.x = -this.regionX;
    if (desiredPos.x >  this.regionX) desiredPos.x =  this.regionX;
    if (desiredPos.z < -this.regionZ) desiredPos.z = -this.regionZ;
    if (desiredPos.z >  this.regionZ) desiredPos.z =  this.regionZ;

    // ========== 5. Building collision detection (horizontal circles) ==========
    if (this.obstacles && this.obstacles.length > 0) {
      const aircraftRadius = 1.5; // aircraft's approximate radius (tweakable)

      for (const obs of this.obstacles) {
        const o = obs.object;
        if (!o) continue;

        // do circular collision checks in XZ plane
        const dx = desiredPos.x - o.position.x;
        const dz = desiredPos.z - o.position.z;
        const r  = obs.radius + aircraftRadius;
        const distSq = dx * dx + dz * dz;

        if (distSq < r * r) {
          // collision: push desired position along normal to outside the collision circle
          const dist = Math.sqrt(distSq) || 0.0001;
          const nx = dx / dist;
          const nz = dz / dist;

          desiredPos.x = o.position.x + nx * r;
          desiredPos.z = o.position.z + nz * r;
        }
      }
    }

    // ========== 6. Finally write back actual position ==========
    obj.position.copy(desiredPos);
  }


  // camera follow & pan
  updateCamera() {
    const obj = this.player.objects[0];

    const baseOffset = new T.Vector3(0, 3, 8);
    const worldOffset = baseOffset
      .clone()
      .applyQuaternion(obj.quaternion);

    const right = new T.Vector3(1, 0, 0).applyQuaternion(
      this.camera.quaternion
    );
    const up = new T.Vector3(0, 1, 0).applyQuaternion(
      this.camera.quaternion
    );

    const panWorld = right
      .clone()
      .multiplyScalar(this.cameraPan.x)
      .add(up.clone().multiplyScalar(this.cameraPan.y));

    const camPos = obj.position
      .clone()
      .add(worldOffset)
      .add(panWorld);
    this.camera.position.copy(camPos);

    const target = obj.position.clone().add(panWorld);
    this.camera.lookAt(target);

    this.cameraPan.multiplyScalar(0.92);
  }

  // Ring collisions
  checkRingCollisions() {
    const obj = this.player.objects[0];

    for (const ring of this.rings) {
      if (ring.collected || ring.expired) continue;

      const dist = obj.position.distanceTo(
        ring.objects[0].position
      );
      if (dist <= this.collectRadius) {
        ring.collected = true;
        ring.objects[0].visible = false;

        // combo
        if (this.comboTimer > 0) {
          this.comboCount++;
        } else {
          this.comboCount = 1;
        }
        this.comboTimer = this.comboWindow;

        const bonus = Math.max(0, this.comboCount - 1);
        this.score += 1 + bonus;

        this.boostRemaining = Math.min(
          this.boostMax,
          this.boostRemaining + 0.8 + 0.2 * bonus
        );

        const pos = ring.objects[0].position.clone();
        const burst = new RingBurst(pos);
        burst.addToScene(this.scene);
        this.effects.push(burst);

        if (this.audio) {
          this.audio.playCollect();
          this.audio.playCombo(this.comboCount);
        }
      }
    }
  }

  // TimeOrb collision: enter range -> red beam + explosion + add time
  checkTimeOrbCollisions() {
    const obj = this.player.objects[0];

    for (const orb of this.timeOrbs) {
      if (orb.collected || orb.expired) continue;

      const orbMesh = orb.objects[0];
      const dist = obj.position.distanceTo(orbMesh.position);

      if (dist <= orb.triggerRadius) {
        orb.collected = true;
        orbMesh.visible = false;

        const start = obj.position.clone();
        const end = orbMesh.position.clone();

        // laser beam
        const beam = new LaserBeamEffect(start, end);
        beam.addToScene(this.scene);
        this.effects.push(beam);

        // explosion
        const burst = new RingBurst(end);
        burst.addToScene(this.scene);
        this.effects.push(burst);

        // time +5 seconds, clamped to maxTime
        this.timeRemaining = Math.min(
          this.maxTime,
          this.timeRemaining + 5
        );

        if (this.audio) {
          this.audio.playCollect();
        }
      }
    }
  }

  // cleanup
  cleanupRings() {
    this.rings = this.rings.filter((r) => {
      if (r.collected || r.expired) {
        if (r.objects && r.objects[0]) {
          this.scene.remove(r.objects[0]);
        }
        return false;
      }
      return true;
    });
  }

  cleanupTimeOrbs() {
    this.timeOrbs = this.timeOrbs.filter((orb) => {
      if (orb.collected || orb.expired) {
        if (orb.objects && orb.objects[0]) {
          this.scene.remove(orb.objects[0]);
        }
        return false;
      }
      return true;
    });
  }

  updateEffects(delta) {
    for (const fx of this.effects) {
      fx.update(delta);
    }
  }

  cleanupEffects() {
    this.effects = this.effects.filter((fx) => {
      if (fx.done) {
        fx.removeFromScene(this.scene);
        return false;
      }
      return true;
    });
  }
}
