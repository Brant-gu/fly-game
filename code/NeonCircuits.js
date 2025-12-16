/* jshint esversion: 6 */
// @ts-check

//neon ground circuits

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class NeonCircuits extends GrObject {
    /**
     * @param {{y?:number}} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();

        //slightly above ground to avoid z-fighting
        group.position.y = params.y || 0.22;

        /** @type {T.Mesh[]} */
        const segments = [];

        const lineThickness = 0.05;
        const lineWidth = 0.18;

        //helper to make emissive line material
        function makeMat(hueOffset = 0) {
            const c = new T.Color();
            c.setHSL(0.5 + hueOffset, 1.0, 0.5);
            return new T.MeshStandardMaterial({
                color: 0x04070a,
                emissive: c,
                emissiveIntensity: 0.9,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.95
            });
        }

        //radial lines from center
        const radialCount = 6;
        const radialLength = 10;

        for (let i = 0; i < radialCount; i++) {
            const angle = (i / radialCount) * Math.PI * 2;
            const geom = new T.BoxGeometry(radialLength, lineThickness, lineWidth);
            const mat = makeMat(0.02 * i);
            const mesh = new T.Mesh(geom, mat);

            mesh.position.set(
                (radialLength / 2) * Math.cos(angle),
                0,
                (radialLength / 2) * Math.sin(angle)
            );
            mesh.rotation.y = angle;

            mesh.userData.phase = i * 0.7;
            group.add(mesh);
            segments.push(mesh);
        }

        //concentric ring segments
        const ringRadii = [3, 6, 9];
        const segmentsPerRing = 12;
        const ringSegmentLength = 1.8;

        ringRadii.forEach((r, ringIdx) => {
            for (let j = 0; j < segmentsPerRing; j++) {
                const angle = (j / segmentsPerRing) * Math.PI * 2;
                const geom = new T.BoxGeometry(ringSegmentLength, lineThickness, lineWidth);
                const mat = makeMat(0.03 * ringIdx);
                const mesh = new T.Mesh(geom, mat);

                const cx = Math.cos(angle) * r;
                const cz = Math.sin(angle) * r;

                mesh.position.set(cx, 0, cz);
                mesh.rotation.y = angle;

                mesh.userData.phase = ringIdx * 1.5 + j * 0.4;
                group.add(mesh);
                segments.push(mesh);
            }
        });

        super("NeonCircuits", group);

        this._segments = segments;
        this._time = 0;
    }

    /**
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        this._time += delta / 1000;
        const t = this._time;

        this._segments.forEach((seg) => {
            const mat = /** @type {T.MeshStandardMaterial} */ (seg.material);
            const phase = seg.userData.phase || 0;
            const pulse = 0.75 + 0.45 * Math.sin(t * 4 + phase);
            mat.emissiveIntensity = pulse;
        });
    }

    lookFromLookAt() {
        return [0, 15, 15, 0, 0, 0];
    }
}

