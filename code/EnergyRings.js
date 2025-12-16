/* jshint esversion: 6 */
// @ts-check

//spinning energy rings

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class EnergyRings extends GrObject {
    /**
     * @param {{height?: number, radius?: number}} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();

        const baseHeight = params.height || 6;   //top ring height
        const baseRadius = params.radius || 3;   //ring radius

        //three rings: bottom, middle, top at 1/4, 1/2, 3/4 height
        const heights = [
            baseHeight * 0.25,
            baseHeight * 0.50,
            baseHeight * 0.75
        ];

        //ring colors: red, blue, yellow
        const colors = [0xff0000, 0x0000ff, 0xffff00];

        const rings = [];

        for (let i = 0; i < 3; i++) {
            const ringGeom = new T.TorusGeometry(baseRadius, 0.12, 16, 100);

            const ringMat = new T.MeshStandardMaterial({
                color: colors[i],
                emissive: colors[i],
                emissiveIntensity: 1.0,
                metalness: 0.7,
                roughness: 0.2,
                transparent: true,
                opacity: 0.75
            });

            const ring = new T.Mesh(ringGeom, ringMat);

            ring.position.y = heights[i];

            //lay ring horizontally
            ring.rotation.x = Math.PI / 2;

            group.add(ring);
            rings.push(ring);
        }

        super("EnergyRings", group);

        this.group = group;
        this._rings = rings;
        this._time = 0;
    }

    /**
     * per-frame animation update
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        this._time += delta / 1000;
        const t = this._time;

        //three rings with different rotation speeds and directions
        const speeds = [0.3, -0.5, 0.4];

        this._rings.forEach((ring, i) => {
            //rotate around vertical axis
            ring.rotation.z += speeds[i] * delta * 0.0015;

            //add breathing scale effect
            const scale = 1.0 + 0.05 * Math.sin(t * 2 + i * 1.7);
            ring.scale.set(scale, scale, scale);

            //emissive flicker
            const mat = /** @type {T.MeshStandardMaterial} */ (ring.material);
            mat.emissiveIntensity = 0.9 + 0.3 * Math.sin(t * 3 + i);
        });
    }

    /**
     * look-at camera helper
     */
    lookFromLookAt() {
        return [8, 8, 8, 0, 3, 0];
    }
}

