/* jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";


export class PlayerAircraft {
    constructor() {
        /** @type {T.Group} */
        this.group = new T.Group();

        const palette = {
            base: 0x05060a,
            edge: 0x1f2838,
            glow1: 0x00f6ff,
            glow2: 0x3f89ff
        };

        /** @type {T.Mesh[]} */
        this._glowParts = [];
        /** @type {T.Mesh[]}  */
        this._rotors = [];
        this.engineMat = null;

        /**
         * @param {T.Mesh} m
         */
        const registerGlow = (m) => {
            this._glowParts.push(m);
        };

        const hullGeom = new T.CapsuleGeometry(0.55, 1.8, 8, 16);
        const hullMat = new T.MeshStandardMaterial({
            color: palette.base,
            metalness: 0.95,
            roughness: 0.22,
            emissive: palette.edge,
            emissiveIntensity: 0.4
        });
        const hull = new T.Mesh(hullGeom, hullMat);
        hull.rotation.x = Math.PI / 2;
        this.group.add(hull);
        const cockpitGeom = new T.SphereGeometry(0.55, 20, 20);
        const cockpitMat = new T.MeshStandardMaterial({
            color: palette.glow1,
            emissive: palette.glow1,
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.45,
            roughness: 0.1,
            metalness: 0.15
        });
        const cockpit = new T.Mesh(cockpitGeom, cockpitMat);
        cockpit.scale.set(1.2, 0.7, 1.0);
        cockpit.position.set(0, 0.35, -0.25);
        this.group.add(cockpit);
        registerGlow(cockpit);
        const mainEyeGeom = new T.SphereGeometry(0.16, 16, 16);
        const mainEyeMat = new T.MeshStandardMaterial({
            color: palette.glow2,
            emissive: palette.glow2,
            emissiveIntensity: 2.1
        });
        const mainEye = new T.Mesh(mainEyeGeom, mainEyeMat);
        mainEye.position.set(0, 0.05, -1.15);
        this.group.add(mainEye);
        registerGlow(mainEye);

        const sideEyeGeom = new T.CylinderGeometry(0.05, 0.05, 0.28, 12);
        const sideEyeMat = new T.MeshStandardMaterial({
            color: palette.glow1,
            emissive: palette.glow1,
            emissiveIntensity: 1.6
        });
        const sideLeft = new T.Mesh(sideEyeGeom, sideEyeMat);
        const sideRight = sideLeft.clone();
        sideLeft.rotation.x = Math.PI / 2;
        sideRight.rotation.x = Math.PI / 2;
        sideLeft.position.set(-0.25, 0.08, -1.0);
        sideRight.position.set(0.25, 0.08, -1.0);
        this.group.add(sideLeft, sideRight);
        registerGlow(sideLeft);
        registerGlow(sideRight);
        const antennaGeom = new T.CylinderGeometry(0.03, 0.03, 0.5, 10);
        const antennaMat = new T.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.3
        });
        const antenna = new T.Mesh(antennaGeom, antennaMat);
        antenna.position.set(0, 0.8, -0.1);
        this.group.add(antenna);

        const antennaTipGeom = new T.SphereGeometry(0.06, 10, 10);
        const antennaTipMat = new T.MeshStandardMaterial({
            color: palette.glow1,
            emissive: palette.glow1,
            emissiveIntensity: 1.9
        });
        const antennaTip = new T.Mesh(antennaTipGeom, antennaTipMat);
        antennaTip.position.set(0, 1.05, -0.1);
        this.group.add(antennaTip);
        registerGlow(antennaTip);

        const wingGeom = new T.BoxGeometry(0.12, 0.06, 2.4);
        const wingMat = new T.MeshStandardMaterial({
            color: 0x050308,
            metalness: 0.9,
            roughness: 0.25,
            emissive: palette.edge,
            emissiveIntensity: 0.4
        });
        const wingLeft = new T.Mesh(wingGeom, wingMat);
        const wingRight = wingLeft.clone();
        wingLeft.position.set(-0.7, 0, 0);
        wingRight.position.set(0.7, 0, 0);
        this.group.add(wingLeft, wingRight);

        const wingStripGeom = new T.BoxGeometry(0.02, 0.03, 2.0);
        const wingStripMat = new T.MeshStandardMaterial({
            color: palette.glow1,
            emissive: palette.glow1,
            emissiveIntensity: 1.4
        });
        const wingStripL = new T.Mesh(wingStripGeom, wingStripMat);
        const wingStripR = wingStripL.clone();
        wingStripL.position.set(-0.8, 0.08, 0);
        wingStripR.position.set(0.8, 0.08, 0);
        this.group.add(wingStripL, wingStripR);
        registerGlow(wingStripL);
        registerGlow(wingStripR);
        const agGeom = new T.TorusGeometry(0.6, 0.07, 16, 32);
        const agMat = new T.MeshStandardMaterial({
            color: palette.base,
            metalness: 1.0,
            roughness: 0.15,
            emissive: palette.glow2,
            emissiveIntensity: 1.7
        });
        const agRing = new T.Mesh(agGeom, agMat);
        agRing.rotation.x = Math.PI / 2;
        agRing.position.set(0, -0.35, 0.1);
        this.group.add(agRing);
        registerGlow(agRing);

        const thrusterGroup = new T.Group();
        this.group.add(thrusterGroup);

        const mainEngineMat = new T.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: palette.glow1,
            emissiveIntensity: 2.2,
            transparent: true,
            opacity: 0.7,
            metalness: 0.2,
            roughness: 0.1
        });
        const mainEngine = new T.Mesh(
            new T.ConeGeometry(0.4, 1.0, 24),
            mainEngineMat
        );
        mainEngine.rotation.x = -Math.PI / 2;
        mainEngine.position.set(0, -0.05, 1.4);
        thrusterGroup.add(mainEngine);
        registerGlow(mainEngine);
        this.engineMat = mainEngineMat;

        const auxGeom = new T.CylinderGeometry(0.1, 0.18, 0.4, 16);
        const auxMat = new T.MeshStandardMaterial({
            color: 0x000000,
            emissive: palette.glow1,
            emissiveIntensity: 1.8,
            metalness: 0.2,
            roughness: 0.15
        });
        const auxOffsets = [
            [-0.35, -0.1, 1.1],
            [0.35, -0.1, 1.1],
            [-0.2, -0.25, 0.9],
            [0.2, -0.25, 0.9]
        ];
        auxOffsets.forEach(([x, y, z]) => {
            const aux = new T.Mesh(auxGeom, auxMat);
            aux.rotation.x = -Math.PI / 2;
            aux.position.set(x, y, z);
            thrusterGroup.add(aux);
            registerGlow(aux);
        });

        const rotorGeom = new T.CylinderGeometry(0.22, 0.22, 0.08, 20);
        const rotorMat = new T.MeshStandardMaterial({
            color: 0x111111,
            metalness: 1.0,
            roughness: 0.2,
            emissive: palette.glow2,
            emissiveIntensity: 1.0
        });
        const rotorPositions = [
            [-0.7, 0.25, -0.5],
            [-0.7, 0.25, 0.5],
            [0.7, 0.25, -0.5],
            [0.7, 0.25, 0.5]
        ];
        rotorPositions.forEach(([x, y, z]) => {
            const rotor = new T.Mesh(rotorGeom, rotorMat);
            rotor.rotation.x = Math.PI / 2;
            rotor.position.set(x, y, z);
            this.group.add(rotor);
            this._rotors.push(rotor);
            registerGlow(rotor);
        });

        this.group.position.y = 5;
        this.objects = [this.group];

        // Internal timer (seconds)
        this._pulseT = 0;
    }

    /**
     * Slight hull breathing + rotor rotation + thruster intensity follows speedRatio (increases during boost)
     * @param {number} delta seconds
     * @param {number} [speedRatio] current speed / base speed
     */
    update(delta, speedRatio = 1) {
        this._pulseT += delta;
        const t = this._pulseT;

        // Slight breathing scale (gives a breathing feel)
        const baseScale = 1 + Math.sin(t * 3.0) * 0.02;
        this.group.scale.set(baseScale, baseScale, baseScale);

        // Top rotor rotation (slightly related to speed)
        const rotorSpeed = 10.0 + 8.0 * Math.max(1, speedRatio);
        this._rotors.forEach((r, idx) => {
            // Slight staggered phase offset for more realism
            r.rotation.y += rotorSpeed * delta * (idx % 2 === 0 ? 1 : 0.9);
        });

        // Tail thruster and glow parts pulsing
        const ratio = Math.max(1, speedRatio);
        this._glowParts.forEach((m, idx) => {
            const mat = /** @type {T.MeshStandardMaterial} */ (m.material);
            if (!mat.emissive) return;
            const pulse =
                1.0 * ratio +
                0.5 * Math.sin(t * 6.0 + idx * 0.7) +
                0.3 * Math.sin(t * 11.3 + idx * 1.31);
            mat.emissiveIntensity = Math.max(0.3, pulse);
        });

        // Main nozzle extra intensity & opacity variation (more prominent and translucent during boost)
        if (this.engineMat) {
            const flicker = 0.3 * Math.sin(t * 12.0);
            this.engineMat.emissiveIntensity = 2.4 * ratio + flicker;
            this.engineMat.opacity = 0.55 + 0.25 * ratio;
        }
    }
}
