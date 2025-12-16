/* jshint esversion: 6 */
// @ts-check

// TimeOrb: glowing orb that grants extra time

import * as T from "../libs/CS559-Three/build/three.module.js";

export class TimeOrb {
  /**
   * @param {{
   *   x?: number,
   *   y?: number,
   *   z?: number,
   *   radius?: number,
   *   triggerRadius?: number,
   *   lifetime?: number
   * }} [params]
   */
  constructor(params = {}) {
    const radius        = params.radius        || 0.7;
    const triggerRadius = params.triggerRadius || 12;
    const lifetime      = params.lifetime      || 10;

    const geom = new T.SphereGeometry(radius, 20, 20);
    const mat  = new T.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00ff99,
      emissiveIntensity: 2.0,
      metalness: 0.5,
      roughness: 0.15,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new T.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.position.set(
      params.x ?? 0,
      params.y ?? 12,
      params.z ?? 0
    );

    this.objects = [mesh];

    /** @type {number} */
    this.triggerRadius = triggerRadius;

    this.age = 0;
    this.lifetime = lifetime;

    this.collected = false;
    this.expired = false;

    /** @type {T.MeshStandardMaterial} */
    this.material = mat;
  }

  /**
   * @param {number} delta 
   */
  update(delta) {
    if (this.collected || this.expired) return;

    this.age += delta;
    if (this.age >= this.lifetime) {
      this.expired = true;
      this.objects[0].visible = false;
      return;
    }

    // simple breathing + rotation effect
    const t = this.age;
    const pulse = 1.6 + Math.sin(t * 6.0) * 0.6;
    this.material.emissiveIntensity = pulse;
    this.material.opacity = 0.75 + 0.15 * Math.sin(t * 4.0);

    this.objects[0].rotation.y += delta * 1.2;
    this.objects[0].rotation.x += delta * 0.4;
  }
}
