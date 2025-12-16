/* jshint esversion: 6 */
// @ts-check

// Data-style neon air ring for the flying game.

import * as T from "../libs/CS559-Three/build/three.module.js";

/**
 * Small particle burst effect when a ring is collected (RingBurst)
 */
export class RingBurst {
  /**
   * @param {T.Vector3} position world coordinates
   */
  constructor(position) {
    /** @type {T.Group} */
    this.group = new T.Group();

    /** @type {{mesh:T.Mesh, velocity:T.Vector3}[]} */
    this.particles = [];

    /** @type {number} */
    this.age = 0;
    /** @type {number} */
    this.lifetime = 0.4; // seconds
    /** @type {boolean} */
    this.done = false;

    const count = 18;
    for (let i = 0; i < count; i++) {
      const geom = new T.SphereGeometry(0.08, 8, 8);
      const mat = new T.MeshStandardMaterial({
        color: new T.Color(0x66ccff),
        emissive: new T.Color(0x66ccff),
        emissiveIntensity: 1.5,
        metalness: 0.4,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9
      });

      const m = new T.Mesh(geom, mat);
      m.position.copy(position);
      this.group.add(m);

      const dir = new T.Vector3(
        (Math.random() * 2 - 1),
        (Math.random() * 2 - 1),
        (Math.random() * 2 - 1)
      ).normalize();

      const speed = 6 + Math.random() * 4;
      this.particles.push({
        mesh: m,
        velocity: dir.multiplyScalar(speed)
      });
    }
  }

  /**
   * Add to scene
   * @param {T.Scene} scene
   */
  addToScene(scene) {
    scene.add(this.group);
  }

  /**
   * Remove from scene
   * @param {T.Scene} scene
   */
  removeFromScene(scene) {
    scene.remove(this.group);
  }

  /**
   * Update particles each frame
   * @param {number} delta seconds
   */
  update(delta) {
    if (this.done) return;

    this.age += delta;
    const t = this.age / this.lifetime;

    for (const p of this.particles) {
      // simple gravity
      p.velocity.y -= 4 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      const fade = Math.max(0, 1 - t);
      const mat = /** @type {T.MeshStandardMaterial} */ (p.mesh.material);
      mat.emissiveIntensity = 1.5 * fade;
      mat.opacity = 0.9 * fade;
    }

    if (this.age >= this.lifetime) {
      this.done = true;
    }
  }
}

/**
 * Data-style neon air ring (AirRing)
 * - Composed of a wireframe neon ring + a ring of data bars + a few scanlines
 * - Very bright against a blue-sky background (cyan + orange contrast)
 */
export class AirRing {
  /**
   * @param {{
   *   x?: number,
   *   y?: number,
   *   z?: number,
   *   innerRadius?: number,    // inner radius of the ring
   *   tubeRadius?: number,     // tube radius base (used to compute block size)
   *   lifetime?: number        // lifetime (seconds)
   * }} [params]
   */
  constructor(params = {}) {
    const innerRadius = params.innerRadius || 2;
    const tubeRadius  = params.tubeRadius  || 0.35;
    const lifetime    = params.lifetime    || 5; // seconds

    /** @type {T.Group} */
    this.group = new T.Group();
    /** @type {T.Object3D[]} */
    this.objects = [this.group]; // GameController uses objects[0] to get position

    // ========= 1. wireframe base ring (HUD / grid feel) =========
    const baseGeom = new T.TorusGeometry(innerRadius, tubeRadius * 0.35, 8, 64);
    const baseMat = new T.MeshStandardMaterial({
      color: new T.Color(0x00eaff),          // cyan main color
      emissive: new T.Color(0x00eaff),
      emissiveIntensity: 0.7,
      metalness: 0.6,
      roughness: 0.25,
      wireframe: true,
      transparent: true,
      opacity: 0.9
    });
    const baseMesh = new T.Mesh(baseGeom, baseMat);
    this.group.add(baseMesh);

    // ========= 2. data bars: ring of glowing blocks representing data ticks =========
    /** @type {T.Mesh[]} */
    this.bars = [];
    const barCount = 16;
    const barGeom = new T.BoxGeometry(
      tubeRadius * 2.0,
      tubeRadius * 0.9,
      tubeRadius * 0.9
    );

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const barMat = new T.MeshStandardMaterial({
        color: new T.Color(0x11ffff),
        emissive: new T.Color(0x11ffff),
        emissiveIntensity: 1.3,
        metalness: 0.8,
        roughness: 0.15,
        transparent: true,
        opacity: 0.95
      });

      const bar = new T.Mesh(barGeom, barMat);
      const r = innerRadius + tubeRadius * 0.2;

      // distributed along the circumference
      bar.position.set(
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        0
      );
      bar.rotation.z = angle;

      this.group.add(bar);
      this.bars.push(bar);
    }

    // ========= 3. Scanlines: several vertical neon lines to add scanning/HUD feel =========
    /** @type {T.Mesh[]} */
    this.lines = [];
    const lineCount = 4;
    const lineGeom = new T.BoxGeometry(
      tubeRadius * 0.3,
      innerRadius * 2.0,
      tubeRadius * 0.3
    );

    for (let i = 0; i < lineCount; i++) {
      const lineMat = new T.MeshStandardMaterial({
        color: new T.Color(0xffaa33),          // orange-yellow: strong contrast with blue sky
        emissive: new T.Color(0xffaa33),
        emissiveIntensity: 0.9,
        metalness: 0.6,
        roughness: 0.3,
        transparent: true,
        opacity: 0.7
      });

      const line = new T.Mesh(lineGeom, lineMat);
      const angle = (i / lineCount) * Math.PI * 2;
      line.rotation.z = angle;

      this.group.add(line);
      this.lines.push(line);
    }

    // initial position
    this.group.position.set(
      params.x ?? 0,
      params.y ?? 8,
      params.z ?? 0
    );

    /** @type {number} */
    this.age = 0;
    /** @type {number} */
    this.maxLifetime = lifetime;
    /** @type {boolean} */
    this.expired = false;    // expired: time ran out without being collected
    /** @type {boolean} */
    this.collected = false;  // collected by the aircraft

    /** @type {number} */
    this._time = 0;          // time phase used for glow animation
  }

  /**
   * Per-frame update: lifetime + glow animation + rotation
   * @param {number} delta seconds
   */
  update(delta) {
    if (this.collected || this.expired) return;

    this.age += delta;
    this._time += delta;

    // timeout -> expire and hide
    if (this.age >= this.maxLifetime) {
      this.expired = true;
      this.group.visible = false;
      return;
    }

    const lifeT = this.age / this.maxLifetime;    // [0,1]
    const fade = 1 - 0.25 * lifeT;               // fades more as it approaches death

    // ===== Data bars: flowing neon around the ring =====
    const globalGlow = 0.8 + 0.6 * Math.sin(this._time * 6.0);
    for (const bar of this.bars) {
      const mat = /** @type {T.MeshStandardMaterial} */ (bar.material);
      const phase = this._time * 8 + bar.position.x * 0.5;
      const local = globalGlow * (0.5 + 0.5 * Math.sin(phase));
      mat.emissiveIntensity = 0.5 + 1.8 * local;
      mat.opacity = 0.4 + 0.6 * fade;
    }

    // ===== Scanlines: subtle pulsing, like HUD scanning =====
    for (const line of this.lines) {
      const mat = /** @type {T.MeshStandardMaterial} */ (line.material);
      mat.emissiveIntensity = 0.4 + 0.6 * Math.abs(Math.sin(this._time * 4));
      mat.opacity = 0.4 + 0.4 * fade;
    }

    // Slow overall rotation to enhance floating UI feel
    this.group.rotation.z += delta * 0.8;
    this.group.rotation.y += delta * 0.6;
  }
}
