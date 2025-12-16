/* jshint esversion: 6 */
// @ts-check

// cyberpunk hovercraft with Three.js FlyControls

import * as T from "../libs/CS559-Three/build/three.module.js";
import { FlyControls } from "../libs/CS559-Three/examples/jsm/controls/FlyControls.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class CyberHovercraft extends GrObject {
    /**
     * @param {{
     *   x?: number,
     *   y?: number,
     *   z?: number,
     *   scale?: number,
     *   speed?: number
     * }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();
        super("CyberHovercraft", group);

        // ---------- params ----------
        const x = params.x ?? 0;
        const y = params.y ?? 25;
        const z = params.z ?? 0;
        const scale = params.scale ?? 2.5;
        this._speed = params.speed ?? 20;

        group.position.set(x, y, z);
        group.scale.set(scale, scale, scale);

        // ---------- materials ----------
        const hullMat = new T.MeshStandardMaterial({
            color: 0x05060a,
            metalness: 0.95,
            roughness: 0.25,
            emissive: 0x111133,
            emissiveIntensity: 0.4
        });

        const neonBlue = new T.MeshStandardMaterial({
            color: 0x001018,
            emissive: 0x00f6ff,
            emissiveIntensity: 2.0,
            metalness: 0.2,
            roughness: 0.1
        });

        const neonPink = new T.MeshStandardMaterial({
            color: 0x120008,
            emissive: 0xff2266,
            emissiveIntensity: 2.2,
            metalness: 0.2,
            roughness: 0.1
        });

        // ---------- body ----------
        const body = new T.Mesh(
            new T.BoxGeometry(3.6, 0.6, 2.0),
            hullMat
        );
        group.add(body);

        // ---------- cockpit ----------
        const cockpit = new T.Mesh(
            new T.BoxGeometry(1.4, 0.5, 1.2),
            neonBlue
        );
        cockpit.position.set(0.8, 0.45, 0);
        group.add(cockpit);

        // ---------- side wings ----------
        const wingGeom = new T.BoxGeometry(0.3, 0.12, 3.2);
        const wingL = new T.Mesh(wingGeom, hullMat);
        wingL.position.set(-1.2, 0, 0);
        const wingR = wingL.clone();
        wingR.position.x = 1.2;
        group.add(wingL, wingR);

        // ---------- neon strips ----------
        const stripGeom = new T.BoxGeometry(0.05, 0.05, 3.0);
        const stripL = new T.Mesh(stripGeom, neonPink);
        stripL.position.set(-1.4, 0.1, 0);
        const stripR = stripL.clone();
        stripR.position.x = 1.4;
        group.add(stripL, stripR);

        // ---------- engines ----------
        this._engines = [];
        const engineGeom = new T.CylinderGeometry(0.25, 0.35, 0.9, 16);
        for (let i = -1; i <= 1; i += 2) {
            const eng = new T.Mesh(engineGeom, neonBlue);
            eng.rotation.x = Math.PI / 2;
            eng.position.set(-1.6, -0.25, i * 0.7);
            group.add(eng);
            this._engines.push(eng);
        }

        // ---------- lights ----------
        const glow = new T.Mesh(
            new T.CylinderGeometry(1.8, 1.8, 0.05, 32),
            neonPink
        );
        glow.position.y = -0.35;
        group.add(glow);

        // ---------- FlyControls ----------
        this._fly = null;
        this._flyEnabled = false;

        // enable ride
        this.rideable = group;

        this._time = 0;
    }

    /**
     * Bind FlyControls (call from main)
     * @param {HTMLElement} domElement
     */
    enableFlyControls(domElement) {
        if (this._fly) return;

        this._fly = new FlyControls(this.objects[0], domElement);
        this._fly.movementSpeed = this._speed;
        this._fly.rollSpeed = 0.9;
        this._fly.dragToLook = true;
        this._fly.autoForward = false;

        this._flyEnabled = true;
    }

    /**
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        const dt = delta / 1000;
        this._time += dt;

        if (this._fly && this._flyEnabled) {
            this._fly.update(dt);
        }

        // engine pulse animation
        const pulse = 1.8 + 0.6 * Math.sin(this._time * 10);
        this._engines.forEach(e => {
            e.material.emissiveIntensity = pulse;
        });
    }

    lookFromLookAt() {
        const g = this.objects[0];
        return [
            g.position.x + 12,
            g.position.y + 6,
            g.position.z + 12,
            g.position.x,
            g.position.y,
            g.position.z
        ];
    }
}
