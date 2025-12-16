/* jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class CyberRobotWalker extends GrObject {
    /**
     * @param {{
     *  x?: number,
     *  z?: number,
     *  plazaHeight?: number,
     *  areaRadius?: number,    
     *  speed?: number,          
     *  turnInterval?: number,   
     *  maxTurn?: number,        
     *  scale?: number
     * }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();
        CyberRobotWalker._nextId = (CyberRobotWalker._nextId ?? 0) + 1;
        super(`CyberRobotWalker_${CyberRobotWalker._nextId}`, group);

        // ----- params -----
        this._x0 = params.x ?? (Math.random() * 10 - 5);
        this._z0 = params.z ?? (Math.random() * 10 - 5);
        this._y  = (params.plazaHeight ?? 0.2) + 0.02;

        this._areaR = params.areaRadius ?? 80;
        this._speed = params.speed ?? 6.0;                
        this._turnInterval = params.turnInterval ?? 2.5;  
        this._maxTurn = params.maxTurn ?? (Math.PI / 2);
        this._scale = params.scale ?? 1;

        // ----- state -----
        this._dir = new T.Vector3(1, 0, 0); 
        this._targetAngle = Math.random() * Math.PI * 2;
        this._timeToTurn = 0;

        // ----- build mesh (cyberpunk look) -----
        group.scale.set(this._scale, this._scale, this._scale);
        group.position.set(this._x0, this._y, this._z0);

        const bodyMat = new T.MeshStandardMaterial({
            color: 0x101018,
            metalness: 0.85,
            roughness: 0.25,
            emissive: 0x080018,
            emissiveIntensity: 0.4
        });

        const neonMat = new T.MeshStandardMaterial({
            color: 0x050510,
            metalness: 0.25,
            roughness: 0.2,
            emissive: 0xff2266,
            emissiveIntensity: 1.6
        });

        const cyanMat = new T.MeshStandardMaterial({
            color: 0x001018,
            metalness: 0.2,
            roughness: 0.2,
            emissive: 0x00f6ff,
            emissiveIntensity: 1.4
        });

        // body core
        const core = new T.Mesh(
            new T.BoxGeometry(1.2, 0.55, 1.4),
            bodyMat
        );
        core.position.y = 0.45;
        group.add(core);

        // shoulder/armor
        const armor = new T.Mesh(
            new T.BoxGeometry(1.35, 0.2, 1.5),
            bodyMat
        );
        armor.position.y = 0.78;
        group.add(armor);

        // neon strips (left/right)
        const stripGeom = new T.BoxGeometry(0.06, 0.06, 1.25);
        const stripL = new T.Mesh(stripGeom, neonMat);
        stripL.position.set(-0.66, 0.62, 0);
        group.add(stripL);

        const stripR = new T.Mesh(stripGeom, neonMat);
        stripR.position.set(0.66, 0.62, 0);
        group.add(stripR);

        // head
        const head = new T.Mesh(
            new T.BoxGeometry(0.7, 0.38, 0.6),
            bodyMat
        );
        head.position.set(0, 0.95, 0.35);
        group.add(head);

        // eyes
        const eyeGeom = new T.SphereGeometry(0.07, 12, 12);
        const eyeL = new T.Mesh(eyeGeom, cyanMat);
        eyeL.position.set(-0.18, 0.95, 0.68);
        group.add(eyeL);

        const eyeR = new T.Mesh(eyeGeom, cyanMat);
        eyeR.position.set(0.18, 0.95, 0.68);
        group.add(eyeR);

        // wheels / treads
        const wheelMat = new T.MeshStandardMaterial({
            color: 0x0a0a12,
            metalness: 0.6,
            roughness: 0.55,
            emissive: 0x000000
        });

        const wheelGeom = new T.CylinderGeometry(0.22, 0.22, 0.18, 16);
        const mkWheel = (x, z) => {
            const w = new T.Mesh(wheelGeom, wheelMat);
            w.rotation.z = Math.PI / 2;
            w.position.set(x, 0.22, z);
            group.add(w);
            return w;
        };

        this._wheels = [];
        this._wheels.push(mkWheel(-0.55, 0.55));
        this._wheels.push(mkWheel( 0.55, 0.55));
        this._wheels.push(mkWheel(-0.55,-0.55));
        this._wheels.push(mkWheel( 0.55,-0.55));

        // underglow
        const glow = new T.Mesh(
            new T.CylinderGeometry(0.75, 0.75, 0.03, 32),
            neonMat
        );
        glow.position.y = 0.06;
        group.add(glow);
        this.rideable = this.objects[0];
    }

    /**
     * World step callback
     * @param {number} delta  milliseconds since last frame
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        const dt = delta / 1000;

        // countdown to pick a new target direction
        this._timeToTurn -= dt;
        if (this._timeToTurn <= 0) {
            // choose a new target angle relative to current heading, limited by maxTurn
            const curAngle = Math.atan2(this.objects[0].position.x - this.objects[0].position.x + this._dir.x,
                                       this.objects[0].position.z - this.objects[0].position.z + this._dir.z);
            const d = (Math.random() * 2 - 1) * this._maxTurn;
            this._targetAngle = curAngle + d;

            // next interval (small randomness)
            this._timeToTurn = this._turnInterval * (0.6 + 0.8 * Math.random());
        }

        // smoothly rotate current dir toward targetAngle
        const targetDir = new T.Vector3(
            Math.sin(this._targetAngle),
            0,
            Math.cos(this._targetAngle)
        ).normalize();

        // slerp-ish blend in xz
        const blend = Math.min(1, dt * 2.5); // turning responsiveness
        this._dir.lerp(targetDir, blend).normalize();

        // move
        const group = this.objects[0];
        const step = this._dir.clone().multiplyScalar(this._speed * dt);
        group.position.add(step);

        // keep on ground
        group.position.y = this._y;

        // boundary handling (stay within circle of radius _areaR)
        const r = Math.hypot(group.position.x, group.position.z);
        if (r > this._areaR) {
            // push back and reverse heading
            const nx = group.position.x / r;
            const nz = group.position.z / r;
            group.position.x = nx * this._areaR;
            group.position.z = nz * this._areaR;

            // reflect direction
            const n = new T.Vector3(nx, 0, nz);
            // reflect: v' = v - 2(v·n)n
            const v = this._dir.clone();
            const vd = v.dot(n);
            this._dir.copy(v.sub(n.multiplyScalar(2 * vd))).normalize();

            this._targetAngle = Math.atan2(this._dir.x, this._dir.z);
            this._timeToTurn = 0.2; // quickly re-pick soon
        }

        // face forward
        const yaw = Math.atan2(this._dir.x, this._dir.z);
        group.rotation.y = yaw;

        // wheel spin
        const spin = (this._speed * dt) / 0.22;
        for (const w of this._wheels) {
            w.rotation.x += spin;
        }
    }
    lookFromLookAt() {
        const g = this.objects[0];
        return [
            g.position.x + 6,
            g.position.y + 20,
            g.position.z + 6,
            g.position.x,
            g.position.y + 2.0,
            g.position.z
        ];
    }
}
