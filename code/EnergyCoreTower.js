/* jshint esversion: 6 */
// @ts-check

//energy core tower (scaled x1.5)

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class EnergyCoreTower extends GrObject {
    /**
     * @param {{y?: number}} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();

        //base offset from ground
        const baseOffsetY = params.y || 0.2 * 1.5;
        group.position.y = baseOffsetY;

        //==========base==========
        const baseHeight = 1.2 * 1.5;
        const baseGeom = new T.CylinderGeometry(1.5 * 1.5, 1.5 * 1.5, baseHeight, 24);
        const baseMat = new T.MeshStandardMaterial({
            color: 0x111320,
            metalness: 0.9,
            roughness: 0.3,
            emissive: 0x003366,
            emissiveIntensity: 0.6
        });
        const base = new T.Mesh(baseGeom, baseMat);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        //==========inner energy core==========
        const coreHeight = 6.0 * 1.5;
        const coreRadius = 0.6 * 1.5;
        const coreGeom = new T.CylinderGeometry(coreRadius, coreRadius, coreHeight, 32);
        const coreMat = new T.MeshStandardMaterial({
            color: 0x33ddff,
            emissive: 0x33ddff,
            emissiveIntensity: 1.2,
            metalness: 0.3,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        const core = new T.Mesh(coreGeom, coreMat);
        core.position.y = baseHeight / 2 + coreHeight / 2;
        core.castShadow = true;
        group.add(core);

        //==========outer glass shell==========
        const shellGeom = new T.CylinderGeometry(
            coreRadius * 1.4,
            coreRadius * 1.4,
            coreHeight * 1.05,
            40
        );
        const shellMat = new T.MeshStandardMaterial({
            color: 0x050508,
            metalness: 0.2,
            roughness: 0.0,
            transparent: true,
            opacity: 0.35,
            emissive: 0x0066ff,
            emissiveIntensity: 0.35
        });
        const shell = new T.Mesh(shellGeom, shellMat);
        shell.position.y = core.position.y;
        shell.receiveShadow = true;
        group.add(shell);

        //==========top crystal==========
        const crystalGeom = new T.OctahedronGeometry(0.9 * 1.5);
        const crystalMat = new T.MeshStandardMaterial({
            color: 0xff66ff,
            emissive: 0xff66ff,
            emissiveIntensity: 1.5,
            metalness: 0.5,
            roughness: 0.15,
            transparent: true,
            opacity: 0.85
        });
        const crystal = new T.Mesh(crystalGeom, crystalMat);
        crystal.position.y = core.position.y + coreHeight / 2 + (0.9 * 1.5);
        crystal.castShadow = true;
        group.add(crystal);

        super("EnergyCoreTower", group);

        this.group = group;
        this._core = core;
        this._shell = shell;
        this._crystal = crystal;

        this._time = 0;
        this._tmpColor = new T.Color();

        this.highlighted = true;
    }

    /**
     * animation update
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        this._time += delta / 1000;
        const t = this._time;

        //floating motion
        const floatAmp = 0.15 * 1.5;
        const baseY = 0.2 * 1.5;
        this.group.position.y = baseY + Math.sin(t * 0.6) * floatAmp;

        //top crystal spin
        this._crystal.rotation.y += delta * 0.0015;

        //energy pulse
        const pulse = 0.9 + 0.4 * Math.sin(t * 3.0);
        this._core.material.emissiveIntensity = pulse;

        //shell breathing glow
        this._shell.material.emissiveIntensity =
            0.3 + 0.2 * Math.sin(t * 2.0 + 1.0);

        //slow hue shift (blue → cyan → purple)
        const hue = 0.55 + 0.05 * Math.sin(t * 0.5);
        this._tmpColor.setHSL(hue, 1.0, 0.55);
        this._core.material.color.copy(this._tmpColor);
    }

    /**
     * suggested camera view
     */
    lookFromLookAt() {
        const gx = this.group.position.x;
        const gy = this.group.position.y;
        const gz = this.group.position.z;
        return [
            gx + 8, gy + 10, gz + 8,
            gx, gy + 4, gz
        ];
    }
}
