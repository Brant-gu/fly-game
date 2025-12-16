/* jshint esversion: 6 */
// @ts-check

//cyberpunk flying drones without trail system

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class CyberDrones extends GrObject {
    /**
     * @param {{
     *   count?:number,
     *   areaRadius?:number,
     *   minY?:number,
     *   maxY?:number,
     *   baseSpeed?:number,
     *   turnInterval?:number,
     *   maxTurn?:number,
     *   scaleFactor?:number
     * }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();

        const count        = params.count        || 6;
        const areaRadius   = params.areaRadius   || 55;
        const minY         = params.minY         || 24;
        const maxY         = params.maxY         || 32;
        const baseSpeed    = params.baseSpeed    || 7;
        const turnInterval = params.turnInterval || 3.0;
        const maxTurn      = params.maxTurn      || Math.PI / 3;
        const scaleFactor  = params.scaleFactor  || 3.0;

        //core motion state arrays
        /** @type {T.Group[]} */
        const drones = [];
        /** @type {{angle:number, speed:number, y:number, timer:number}[]} */
        const state = [];
        /** @type {T.Mesh[]} */
        const thrusters = [];
        /** @type {T.Object3D[]} */
        const rotors = [];

        //color palettes for different drones
        /** @type {{base:number, edge:number, glow1:number, glow2:number}[]} */
        const palettes = [
            { base:0x05060a, edge:0x222b3b, glow1:0x00f6ff, glow2:0x3f89ff },
            { base:0x05020a, edge:0x2d1633, glow1:0xff00aa, glow2:0xff7bff },
            { base:0x050709, edge:0x243326, glow1:0x66ff66, glow2:0x99ffcc }
        ];

        //helper to register glowing parts into shared thruster list
        /**
         * @param {T.Mesh} m
         */
        function registerGlow(m) {
            thrusters.push(m);
        }

        //create a single detailed drone
        /**
         * @param {number} index
         */
        function makeDrone(index) {
            const drone = new T.Group();
            const palette = palettes[index % palettes.length];

            //main body segment
            const bodyGeom = new T.BoxGeometry(2.4, 0.35, 1.0);
            const bodyMat = new T.MeshStandardMaterial({
                color: palette.base,
                metalness: 0.95,
                roughness: 0.25,
                emissive: palette.edge,
                emissiveIntensity: 0.35
            });
            const body = new T.Mesh(bodyGeom, bodyMat);
            body.castShadow = true;
            drone.add(body);

            //upper armor spine
            const spineGeom = new T.BoxGeometry(2.0, 0.2, 0.4);
            const spineMat = new T.MeshStandardMaterial({
                color: palette.base,
                metalness: 1.0,
                roughness: 0.15,
                emissive: palette.glow2,
                emissiveIntensity: 0.9
            });
            const spine = new T.Mesh(spineGeom, spineMat);
            spine.position.set(0, 0.3, 0);
            drone.add(spine);
            registerGlow(spine);

            //side armor plates
            const plateGeom = new T.BoxGeometry(0.6, 0.18, 1.1);
            const plateMat = new T.MeshStandardMaterial({
                color: palette.edge,
                metalness: 0.8,
                roughness: 0.35
            });
            const plateL = new T.Mesh(plateGeom, plateMat);
            plateL.position.set(-0.9, 0, 0);
            const plateR = plateL.clone();
            plateR.position.x = 0.9;
            drone.add(plateL);
            drone.add(plateR);

            //cockpit block
            const cockpitGeom = new T.BoxGeometry(0.95, 0.4, 0.9);
            const cockpitMat = new T.MeshStandardMaterial({
                color: palette.glow1,
                emissive: palette.glow1,
                emissiveIntensity: 1.6,
                transparent: true,
                opacity: 0.55,
                metalness: 0.2,
                roughness: 0.05
            });
            const cockpit = new T.Mesh(cockpitGeom, cockpitMat);
            cockpit.position.set(0.45, 0.42, 0);
            drone.add(cockpit);
            registerGlow(cockpit);

            //front sensor eye
            const eyeGeom = new T.SphereGeometry(0.15, 16, 16);
            const eyeMat = new T.MeshStandardMaterial({
                color: palette.glow2,
                emissive: palette.glow2,
                emissiveIntensity: 1.7
            });
            const eye = new T.Mesh(eyeGeom, eyeMat);
            eye.position.set(1.25, 0.15, 0);
            drone.add(eye);
            registerGlow(eye);

            //top antenna
            const antennaGeom = new T.CylinderGeometry(0.03, 0.03, 0.6, 8);
            const antennaMat = new T.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.9,
                roughness: 0.3
            });
            const antenna = new T.Mesh(antennaGeom, antennaMat);
            antenna.position.set(-0.6, 0.75, 0);
            drone.add(antenna);

            //antenna tip glow
            const tipGeom = new T.SphereGeometry(0.06, 10, 10);
            const tipMat = new T.MeshStandardMaterial({
                color: palette.glow1,
                emissive: palette.glow1,
                emissiveIntensity: 1.8
            });
            const tip = new T.Mesh(tipGeom, tipMat);
            tip.position.set(-0.6, 1.05, 0);
            drone.add(tip);
            registerGlow(tip);

            //main wings with neon edges
            const wingGeom = new T.BoxGeometry(0.18, 0.07, 2.1);
            const wingMat = new T.MeshStandardMaterial({
                color: 0x050308,
                metalness: 0.85,
                roughness: 0.3,
                emissive: palette.edge,
                emissiveIntensity: 0.4
            });
            const wingL = new T.Mesh(wingGeom, wingMat);
            wingL.position.set(-0.45, 0.05, 0);
            const wingR = wingL.clone();
            wingR.position.x = 0.45;
            drone.add(wingL);
            drone.add(wingR);

            //neon strips on wings
            const stripGeom = new T.BoxGeometry(0.02, 0.03, 2.0);
            const stripMat = new T.MeshStandardMaterial({
                color: palette.glow1,
                emissive: palette.glow1,
                emissiveIntensity: 1.3
            });
            const stripL = new T.Mesh(stripGeom, stripMat);
            stripL.position.set(-0.55, 0.1, 0);
            const stripR = stripL.clone();
            stripR.position.x = 0.55;
            drone.add(stripL);
            drone.add(stripR);
            registerGlow(stripL);
            registerGlow(stripR);

            //rotor pods at wing tips
            const rotorGeom = new T.CylinderGeometry(0.16, 0.16, 0.08, 20);
            const rotorMat = new T.MeshStandardMaterial({
                color: 0x111111,
                metalness: 1.0,
                roughness: 0.2,
                emissive: palette.glow2,
                emissiveIntensity: 1.0
            });
            const rotorL = new T.Mesh(rotorGeom, rotorMat);
            rotorL.rotation.z = Math.PI / 2;
            rotorL.position.set(-0.8, 0.05, 0.7);
            const rotorL2 = rotorL.clone();
            rotorL2.position.z = -0.7;

            const rotorR = rotorL.clone();
            rotorR.position.x = 0.8;
            const rotorR2 = rotorR.clone();
            rotorR2.position.z = -0.7;

            drone.add(rotorL, rotorL2, rotorR, rotorR2);
            rotors.push(rotorL, rotorL2, rotorR, rotorR2);
            registerGlow(rotorL);
            registerGlow(rotorL2);
            registerGlow(rotorR);
            registerGlow(rotorR2);

            //rear engine ring
            const ringGeom = new T.TorusGeometry(0.45, 0.08, 12, 32);
            const ringMat = new T.MeshStandardMaterial({
                color: palette.base,
                metalness: 1.0,
                roughness: 0.15,
                emissive: palette.glow2,
                emissiveIntensity: 1.2
            });
            const ring = new T.Mesh(ringGeom, ringMat);
            ring.rotation.y = Math.PI / 2;
            ring.position.set(-1.25, 0.05, 0);
            drone.add(ring);
            registerGlow(ring);

            //underbody thrusters
            const thrusterGeom = new T.CylinderGeometry(0.13, 0.22, 0.5, 16);
            const thrusterMat = new T.MeshStandardMaterial({
                color: 0x000000,
                emissive: palette.glow1,
                emissiveIntensity: 2.0,
                metalness: 0.2,
                roughness: 0.1
            });

            const t1 = new T.Mesh(thrusterGeom, thrusterMat);
            t1.rotation.z = Math.PI / 2;
            t1.position.set(-0.6, -0.1, 0.35);

            const t2 = t1.clone();
            t2.position.z = -0.35;

            drone.add(t1);
            drone.add(t2);
            registerGlow(t1);
            registerGlow(t2);

            //central bottom glow
            const bottomGeom = new T.SphereGeometry(0.12, 16, 16);
            const bottomMat = new T.MeshStandardMaterial({
                color: palette.glow2,
                emissive: palette.glow2,
                emissiveIntensity: 1.9
            });
            const bl = new T.Mesh(bottomGeom, bottomMat);
            bl.position.set(0, -0.28, 0);
            drone.add(bl);
            registerGlow(bl);

            return drone;
        }

        //create drone fleet
        for (let i = 0; i < count; i++) {
            const d = makeDrone(i);
            d.scale.set(scaleFactor, scaleFactor, scaleFactor);

            //initial position
            const r = areaRadius * (0.4 + Math.random() * 0.6);
            const a = Math.random() * Math.PI * 2;
            const x = Math.cos(a) * r;
            const z = Math.sin(a) * r;
            const y = minY + Math.random() * (maxY - minY);

            d.position.set(x, y, z);

            //initial motion
            const angle = Math.random() * Math.PI * 2;
            const speed = baseSpeed * (0.7 + 0.6 * Math.random());
            const timer = Math.random() * turnInterval;

            d.rotation.y = -angle + Math.PI / 2;

            group.add(d);
            drones.push(d);
            state.push({ angle, speed, y, timer });
        }

        super("CyberDrones", group);

        this._group = group;
        this._drones = drones;
        this._state = state;
        this._thrusters = thrusters;
        this._rotors = rotors;
        this._areaRadius = areaRadius;
        this._minY = minY;
        this._maxY = maxY;
        this._turnInterval = turnInterval;
        this._maxTurn = maxTurn;
        this._baseSpeed = baseSpeed;
        this._scaleFactor = scaleFactor;

        //first drone is rideable
        this.rideable = this._drones[0];

        this._time = 0;
    }

    /**
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        const dt = delta / 1000;
        this._time += dt;
        const t = this._time;

        const areaR = this._areaRadius;

        //update drone motion and hovering
        this._drones.forEach((d, i) => {
            const s = this._state[i];

            s.timer += dt;
            if (s.timer >= this._turnInterval) {
                s.timer = 0;
                s.angle += (Math.random() - 0.5) * 2 * this._maxTurn;
                s.y += (Math.random() - 0.5) * 2;
                s.y = Math.max(this._minY, Math.min(this._maxY, s.y));
            }

            const dx = Math.cos(s.angle) * s.speed * dt;
            const dz = Math.sin(s.angle) * s.speed * dt;

            d.position.x += dx;
            d.position.z += dz;

            const hover = 0.4 * Math.sin(t * 2.0 + i * 0.9);
            d.position.y = s.y + hover;

            const r = Math.hypot(d.position.x, d.position.z);
            if (r > areaR) {
                s.angle += Math.PI;
            }

            d.rotation.y = -s.angle + Math.PI / 2;
            d.rotation.z = 0.09 * Math.sin(t * 3.0 + i * 1.3);
        });

        //rotor spin animation
        this._rotors.forEach((rotor, idx) => {
            rotor.rotation.y += 12.0 * dt;
        });

        //thruster and neon glow animation
        this._thrusters.forEach((thr, idx) => {
            /** @type {T.MeshStandardMaterial} */
            //cast to access emissiveIntensity
            const mat = /** @type {T.MeshStandardMaterial} */ (thr.material);
            const pulse =
                2.0 +
                0.6 * Math.sin(t * 10 + idx * 0.7) +
                0.4 * Math.sin(t * 17 + idx * 1.3);
            mat.emissiveIntensity = pulse;
        });
    }

    lookFromLookAt() {
        const d = this._drones[0];
        return [
            d.position.x + 15,
            d.position.y + 8,
            d.position.z + 15,
            d.position.x,
            d.position.y,
            d.position.z
        ];
    }
}
