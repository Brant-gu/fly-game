/* jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

/**
 * neon drone swarm circling above the plaza
 */
export class NeonDrone extends GrObject {
    constructor() {
        const group = new T.Group();

        const droneGeom = new T.SphereGeometry(0.3, 16, 16);

        //save for stepWorld
        const drones = [];

        const droneCount = 10;
        for (let i = 0; i < droneCount; i++) {
            const mat = new T.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0x00ffff,
                emissiveIntensity: 1.0,
                metalness: 1.0,
                roughness: 0.2
            });

            const drone = new T.Mesh(droneGeom, mat);

            //actual position updated in stepWorld
            drone.position.set(0, 4, 0);

            //each drone has a different phase
            drone.userData.phase = (i / droneCount) * Math.PI * 2;

            group.add(drone);
            drones.push(drone);
        }

        //weak light on top
        const lightRing = new T.PointLight(0x00ffff, 0.6, 30);
        lightRing.position.set(0, 5, 0);
        group.add(lightRing);

        super("NeonDrone", group);

        this.group = group;
        this._drones = drones;
        this._time = 0;  
    }

    /**
     *lets the drones circle above the plaza
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        this._time += delta;

        const baseRadius = 9;          // drone circling radius
        const angularSpeed = 0.0000001;// angular speed (circling speed)
        const floatSpeed = 0.001;      // floating speed (up and down)
        const floatHeight = 1.2;       // floating amplitude
        const baseHeight = 4;          // base height
        this._drones.forEach((drone) => {
            const phase = drone.userData.phase;

            const angle = this._time * angularSpeed + phase;
            const y = baseHeight + Math.sin(this._time * floatSpeed + phase) * floatHeight;

            const x = Math.cos(angle) * baseRadius;
            const z = Math.sin(angle) * baseRadius;

            drone.position.set(x, y, z);

            // drones face the plaza center
            drone.lookAt(0, baseHeight, 0);
        });
    }
}
