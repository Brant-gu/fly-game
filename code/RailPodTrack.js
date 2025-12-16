/* jshint esversion: 6 */
// @ts-check

//cyberpunk maglev ring with multi car train

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class RailPodTrack extends GrObject {
    /**
     * @param {{
     *   radius?:number,
     *   segments?:number,
     *   podSpeed?:number,
     *   y?:number
     * }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();

        //train scale factor only, track stays original size
        const scaleFactor = 5;

        const radius = params.radius || 14;   //track radius
        const podSpeed = params.podSpeed || 0.6;  //pod angular speed (rad/sec)
        const baseY = params.y || 0.3;       //track height above ground

        //track thickness and inner ring parameters
        const trackTubeRadius = 0.25;
        const trackWidth = 0.6;
        const innerRadius = radius - trackWidth * 0.6;

        //smooth torus track with emissive edges
        const trackGeom = new T.TorusGeometry(radius, trackTubeRadius, 24, 140);
        const trackMat = new T.MeshStandardMaterial({
            color: 0x050913,
            metalness: 1.0,
            roughness: 0.25,
            emissive: 0x004477,
            emissiveIntensity: 0.6
        });
        const track = new T.Mesh(trackGeom, trackMat);
        track.rotateX(Math.PI / 2);   //make torus horizontal
        track.position.y = baseY;
        track.castShadow = true;
        group.add(track);

        //floating energy panels above the track surface
        const panelGeom = new T.BoxGeometry(0.5, 0.04, 1.2);
        const panelMat = new T.MeshStandardMaterial({
            color: 0x020308,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x00aaff,
            emissiveIntensity: 0.9
        });
        const panels = [];
        const panelCount = 16;
        for (let i = 0; i < panelCount; i++) {
            const panel = new T.Mesh(panelGeom, panelMat);
            const angle = (i / panelCount) * Math.PI * 2;
            const pr = radius + 0.3;
            panel.position.set(
                Math.cos(angle) * pr,
                baseY + trackTubeRadius * 0.4,
                Math.sin(angle) * pr
            );
            panel.rotation.y = -angle + Math.PI / 2;
            group.add(panel);
            panels.push(panel);
        }

        //inner energy light ring
        const lightGeom = new T.RingGeometry(innerRadius * 0.98, innerRadius * 1.02, 96);
        const lightMat = new T.MeshBasicMaterial({
            color: 0x0fa0ff,
            transparent: true,
            opacity: 0.32,
            side: T.DoubleSide
        });
        const lightRing = new T.Mesh(lightGeom, lightMat);
        lightRing.rotation.x = -Math.PI / 2;
        lightRing.position.y = baseY + 0.02;
        group.add(lightRing);

        //pod train head and cars

        /**@type {T.Mesh[]}*/
        const cars = [];

        const totalCars = 1 + 6;   //1 head + 6 cars

        //arc-length spacing between cars along the track (world units)
        const carArcSpacing = 1.6 * scaleFactor;

        //shared body geometry scaled up
        const carHeight = 0.7 * scaleFactor;
        const carLength = 1.6 * scaleFactor;
        const carWidth = 0.9 * scaleFactor;
        const bodyGeom = new T.BoxGeometry(carLength, carHeight, carWidth);

        //materials for head and cars
        const headMat = new T.MeshStandardMaterial({
            color: 0x050608,
            metalness: 1.0,
            roughness: 0.28,
            emissive: 0x009988,
            emissiveIntensity: 0.9
        });
        const carMat = new T.MeshStandardMaterial({
            color: 0x040506,
            metalness: 0.95,
            roughness: 0.3,
            emissive: 0x004c73,
            emissiveIntensity: 0.6
        });

        /**@type {T.Mesh[]}*/
        const glowStrips = [];
        /**@type {T.Mesh[]}*/
        const underEmitters = [];

        //add side neon stripes to a car
        /**
         * @param {T.Mesh} body
         * @param {boolean} isHead
         */
        function addSideStrips(body, isHead) {
            const color = isHead ? 0x00ffd5 : 0x00a4ff;
            const stripGeom = new T.BoxGeometry(0.05 * scaleFactor, 0.12 * scaleFactor, 1.5 * scaleFactor);
            const stripMat = new T.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: isHead ? 1.2 : 0.9,
                metalness: 0.5,
                roughness: 0.15
            });

            const left = new T.Mesh(stripGeom, stripMat);
            left.position.set(-0.9 * scaleFactor, 0.05 * scaleFactor, 0);
            const right = left.clone();
            right.position.x = 0.9 * scaleFactor;

            body.add(left);
            body.add(right);

            glowStrips.push(left, right);
        }

        //add side window band and doors
        /**
         * @param {T.Mesh} body
         * @param {boolean} isHead
         */
        function addWindowsAndDoors(body, isHead) {
            const windowColor = 0x0b2a3a;
            const windowGlow = 0x1bb1ff;
            const bandHeight = 0.3 * scaleFactor;
            const bandGeom = new T.BoxGeometry(carLength * 0.9, bandHeight, 0.04 * scaleFactor);
            const bandMat = new T.MeshStandardMaterial({
                color: windowColor,
                metalness: 0.3,
                roughness: 0.35,
                emissive: windowGlow,
                emissiveIntensity: isHead ? 0.9 : 0.7
            });

            const bandL = new T.Mesh(bandGeom, bandMat);
            bandL.position.set(0, 0.1 * scaleFactor, carWidth * 0.52);
            const bandR = bandL.clone();
            bandR.position.z = -carWidth * 0.52;
            body.add(bandL);
            body.add(bandR);
            glowStrips.push(bandL, bandR);

            //door panels
            const doorGeom = new T.BoxGeometry(0.35 * scaleFactor, 0.55 * scaleFactor, 0.06 * scaleFactor);
            const doorMat = new T.MeshStandardMaterial({
                color: 0x061015,
                metalness: 0.6,
                roughness: 0.35,
                emissive: 0x0070a0,
                emissiveIntensity: 0.4
            });

            const doorOffsetX = carLength * 0.15;
            const doorL = new T.Mesh(doorGeom, doorMat);
            doorL.position.set(-doorOffsetX, 0, carWidth * 0.53);
            const doorL2 = doorL.clone();
            doorL2.position.x = doorOffsetX;

            const doorR = doorL.clone();
            doorR.position.z = -carWidth * 0.53;
            const doorR2 = doorL2.clone();
            doorR2.position.z = -carWidth * 0.53;

            body.add(doorL, doorL2, doorR, doorR2);
        }

        //add bottom maglev emitters and undercarriage
        /**
         * @param {T.Mesh} body
         */
        function addBottomDetails(body) {
            //undercarriage frame
            const frameGeom = new T.BoxGeometry(carLength * 0.9, 0.12 * scaleFactor, carWidth * 0.7);
            const frameMat = new T.MeshStandardMaterial({
                color: 0x020304,
                metalness: 0.8,
                roughness: 0.35
            });
            const frame = new T.Mesh(frameGeom, frameMat);
            frame.position.set(0, -carHeight * 0.5 - 0.06 * scaleFactor, 0);
            body.add(frame);

            //bogie side beams
            const bogieGeom = new T.BoxGeometry(0.08 * scaleFactor, 0.3 * scaleFactor, carWidth * 0.7);
            const bogieMat = new T.MeshStandardMaterial({
                color: 0x11161c,
                metalness: 0.8,
                roughness: 0.3
            });
            const bogieOffset = carLength * 0.32;
            const bogieFront = new T.Mesh(bogieGeom, bogieMat);
            bogieFront.position.set(bogieOffset, -carHeight * 0.5, 0);
            const bogieRear = bogieFront.clone();
            bogieRear.position.x = -bogieOffset;
            body.add(bogieFront, bogieRear);

            //maglev emitters
            const emitterGeom = new T.CylinderGeometry(0.12 * scaleFactor, 0.12 * scaleFactor, 0.06 * scaleFactor, 12);
            const emitterMat = new T.MeshStandardMaterial({
                color: 0x00111c,
                metalness: 0.9,
                roughness: 0.22,
                emissive: 0x00d0ff,
                emissiveIntensity: 1.3
            });

            const count = 3;
            for (let i = 0; i < count; i++) {
                const e = new T.Mesh(emitterGeom, emitterMat);
                e.rotation.x = Math.PI / 2;
                const offset = ((i - 1) * 0.7) * scaleFactor;
                e.position.set(offset, -carHeight * 0.5 - 0.12 * scaleFactor, 0);
                body.add(e);
                underEmitters.push(e);
            }
        }

        //add roof equipment pods and light bars
        /**
         * @param {T.Mesh} body
         * @param {boolean} isHead
         */
        function addRoofDetails(body, isHead) {
            const podGeom = new T.BoxGeometry(0.5 * scaleFactor, 0.18 * scaleFactor, 0.5 * scaleFactor);
            const podMat = new T.MeshStandardMaterial({
                color: 0x0b0d13,
                metalness: 0.95,
                roughness: 0.25
            });
            const pod1 = new T.Mesh(podGeom, podMat);
            const pod2 = pod1.clone();
            pod1.position.set(-0.35 * scaleFactor, carHeight * 0.45, 0);
            pod2.position.set(0.35 * scaleFactor, carHeight * 0.45, 0);
            body.add(pod1, pod2);

            const barGeom = new T.BoxGeometry(carLength * 0.9, 0.06 * scaleFactor, 0.18 * scaleFactor);
            const barColor = isHead ? 0x00b3ff : 0x0078ff;
            const barMat = new T.MeshStandardMaterial({
                color: barColor,
                emissive: barColor,
                emissiveIntensity: isHead ? 1.1 : 0.8,
                metalness: 0.6,
                roughness: 0.12
            });
            const roofBar = new T.Mesh(barGeom, barMat);
            roofBar.position.y = carHeight * 0.5;
            body.add(roofBar);
            glowStrips.push(roofBar);
        }

        //add side advertisement panels
        /**
         * @param {T.Mesh} body
         */
        function addSideAds(body) {
            const adGeom = new T.BoxGeometry(0.4 * scaleFactor, 0.25 * scaleFactor, 0.03 * scaleFactor);
            const adMat = new T.MeshStandardMaterial({
                color: 0x111111,
                emissive: 0xff2fd6,
                emissiveIntensity: 1.1,
                metalness: 0.7,
                roughness: 0.25
            });
            const adL = new T.Mesh(adGeom, adMat);
            adL.position.set(carLength * 0.32, -0.05 * scaleFactor, carWidth * 0.53);
            const adR = adL.clone();
            adR.position.z = -carWidth * 0.53;
            body.add(adL, adR);
            glowStrips.push(adL, adR);
        }

        //create each car on the circle
        for (let i = 0; i < totalCars; i++) {
            const isHead = (i === 0);
            const isTail = (i === totalCars - 1);
            const mat = isHead ? headMat : carMat;
            const body = new T.Mesh(bodyGeom, mat);
            body.castShadow = true;

            //core detail blocks
            addSideStrips(body, isHead);
            addWindowsAndDoors(body, isHead);
            addBottomDetails(body);
            addRoofDetails(body, isHead);
            addSideAds(body);

            //head specific nose and lights
            if (isHead) {
                const noseGeom = new T.BoxGeometry(0.6 * scaleFactor, 0.55 * scaleFactor, 0.9 * scaleFactor);
                const noseMat = new T.MeshStandardMaterial({
                    color: 0x05070a,
                    metalness: 1.0,
                    roughness: 0.25,
                    emissive: 0x009988,
                    emissiveIntensity: 0.8
                });
                const nose = new T.Mesh(noseGeom, noseMat);
                nose.position.set(carLength * 0.55, -0.05 * scaleFactor, 0);
                body.add(nose);

                const lightGeom = new T.BoxGeometry(0.12 * scaleFactor, 0.12 * scaleFactor, 0.12 * scaleFactor);
                const lightMat = new T.MeshStandardMaterial({
                    color: 0xffffee,
                    emissive: 0xfff6c0,
                    emissiveIntensity: 1.6,
                    metalness: 0.4,
                    roughness: 0.2
                });
                const headLightL = new T.Mesh(lightGeom, lightMat);
                headLightL.position.set(carLength * 0.7, -0.05 * scaleFactor, 0.22 * scaleFactor);
                const headLightR = headLightL.clone();
                headLightR.position.z = -0.22 * scaleFactor;
                body.add(headLightL, headLightR);
                glowStrips.push(headLightL, headLightR);
            }

            //simple coupler block for all but tail car
            if (!isTail) {
                const couplerGeom = new T.BoxGeometry(0.22 * scaleFactor, 0.16 * scaleFactor, 0.16 * scaleFactor);
                const couplerMat = new T.MeshStandardMaterial({
                    color: 0x111318,
                    metalness: 0.9,
                    roughness: 0.3
                });
                const coupler = new T.Mesh(couplerGeom, couplerMat);
                coupler.position.set(-carLength * 0.55, -0.18 * scaleFactor, 0);
                body.add(coupler);
            }

            group.add(body);
            cars.push(body);
        }

        //must call parent constructor before using this
        super("RailPodTrack", group);

        this.group = group;
        this._track = track;
        this._lightRing = lightRing;
        this._panels = panels;

        this._radius = radius;
        this._trackTubeRadius = trackTubeRadius;
        this._carBaseY = baseY + trackTubeRadius + carHeight * 0.5 + 0.2 * scaleFactor;
        this._podSpeed = podSpeed;

        this._time = 0;
        this._angleHead = 0;

        this._cars = cars;
        this._carArcSpacing = carArcSpacing;
        this._glowStrips = glowStrips;
        this._underEmitters = underEmitters;
        this._scaleFactor = scaleFactor;

        const headCar = this._cars[0];
        this._ridePoint = new T.Object3D();
        this._ridePoint.position.set(0, carHeight * 0.7, 0);
        headCar.add(this._ridePoint);

        this.rideable = this._ridePoint;
    }

    /**
     * @param {number} delta
     * @param {number} timeOfDay}
     */
    stepWorld(delta, timeOfDay) {
        const dt = delta / 1000;
        this._time += dt;

        const cycle = 8;
        const phase = this._time % cycle;
        const isStopped = (phase >= 3 && phase < 5);

        if (!isStopped) {
            this._angleHead += this._podSpeed * dt;
        }

        //update cars along circular track
        for (let i = 0; i < this._cars.length; i++) {
            const car = this._cars[i];

            const offsetArc = i * this._carArcSpacing;
            const offsetAngle = offsetArc / this._radius;

            const carAngle = this._angleHead - offsetAngle;

            const x = Math.cos(carAngle) * this._radius;
            const z = Math.sin(carAngle) * this._radius;

            const hover = 0.05 * this._scaleFactor * Math.sin(this._time * 1.5 + i * 0.4);
            car.position.set(x, this._carBaseY + hover, z);

            car.rotation.y = -carAngle + Math.PI / 2;

            //keep train stable, no side rocking
            car.rotation.z = 0;
        }

        //track emissive pulse
        if (this._track) {
            const mat = /**@type {T.MeshStandardMaterial}*/ (this._track.material);
            const pulse = 0.6 + 0.25 * Math.sin(this._time * 2.4);
            mat.emissiveIntensity = pulse;
        }

        //inner light ring flicker and rotation
        if (this._lightRing) {
            const lm = /**@type {T.MeshBasicMaterial}*/ (this._lightRing.material);
            lm.opacity = 0.26 + 0.12 * Math.sin(this._time * 3.3);
            this._lightRing.rotation.z = this._time * 0.18;
        }

        //floating panels bobbing and tilt
        if (this._panels) {
            this._panels.forEach((p, idx) => {
                const t = this._time + idx * 0.4;
                const bob = 0.02 * Math.sin(t * 2.1);
                p.position.y = this._track.position.y + this._trackTubeRadius * 0.4 + bob;
                p.rotation.z = 0.04 * Math.sin(t * 1.4);
            });
        }

        //neon strip intensity modulation
        if (this._glowStrips) {
            this._glowStrips.forEach((g, idx) => {
                const mat = /**@type {T.MeshStandardMaterial}*/ (g.material);
                const pulse = 0.9 + 0.5 * Math.sin(this._time * 5.5 + idx * 0.7);
                if (mat.emissiveIntensity !== undefined) {
                    mat.emissiveIntensity = pulse;
                }
            });
        }

        //bottom maglev emitters pulsing and rotation
        if (this._underEmitters) {
            this._underEmitters.forEach((e, idx) => {
                const mat = /**@type {T.MeshStandardMaterial}*/ (e.material);
                const p = 1.2 + 0.7 * Math.sin(this._time * 7.5 + idx * 0.9);
                mat.emissiveIntensity = p;
                e.rotation.y = this._time * 2.6;
            });
        }
    }

    lookFromLookAt() {
        return [0, this._radius * 0.5, this._radius * 2.2, 0, 0, 0];
    }
}
