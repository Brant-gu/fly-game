/* jshint esversion: 6 */
//@ts-check

//heavy industrial mega complex towers
//denser, heavier, more brutalist than b1/b2

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

const HEIGHT_SCALE = 0.85;

function enableShadows(m) {
    m.castShadow = true;
    m.receiveShadow = true;
}

function addPanelStrip(parent, opt) {//help function to add segmented panel strip
    const {
        material,
        xStart,
        xEnd,
        y,
        z,
        thickness = 0.12,
        height = 0.25,
        segments = 6
    } = opt;

    const geom = new T.BoxGeometry(1, 1, 1);
    const len = xEnd - xStart;

    for (let i = 0; i < segments; i++) {
        const u0 = i / segments;
        const u1 = (i + 0.8) / segments;   
        const x0 = xStart + len * u0;
        const x1 = xStart + len * u1;

        const cx = (x0 + x1) / 2;
        const w  = Math.abs(x1 - x0);

        const p = new T.Mesh(geom, material);
        p.scale.set(w, height, thickness);
        p.position.set(cx, y, z);
        enableShadows(p);
        parent.add(p);
    }
}


//create heavy brutalist industrial tower
function createBrutalistTower(plazaHeight, boxGeom, cylGeom) {
    const root = new T.Group();
    root.position.y = plazaHeight;

    const baseCol  = new T.Color(0x3a2f45);
    const panelCol = new T.Color(0x2a3038);
    const steelCol = new T.Color(0x7e8a96);
    const warnCol = new T.Color(0xffc800);
    const neonBlue = new T.Color(0x4cf2ff);

    const baseMat = new T.MeshStandardMaterial({
        color: baseCol, metalness: 0.7,roughness: 0.42,emissive: 0x08040c,
        emissiveIntensity: 0.28
    });
    const panelMat = new T.MeshStandardMaterial({
        color: panelCol, metalness: 0.75, roughness: 0.5,
        emissive: 0x030406, emissiveIntensity: 0.2
    });
    const steelMat = new T.MeshStandardMaterial({
        color: steelCol, metalness: 0.9, roughness: 0.35
    });
    const warnMat = new T.MeshStandardMaterial({
        color: 0x000000, emissive: warnCol,
        emissiveIntensity: 1.8
    });
    const neonMat = new T.MeshStandardMaterial({
        color: 0x000000, emissive: neonBlue,
        emissiveIntensity: 2.3
    });
    const greebleMat = new T.MeshStandardMaterial({
        color: 0x23272d, metalness: 0.6, roughness: 0.45
    });

    const neonRed = new T.Color(0xff2a6d);  
    const neonBlue2 = new T.Color(0x4cf2ff); 

    const greebleNeonRedMat = new T.MeshStandardMaterial({
        color: 0x000000,emissive: neonRed,emissiveIntensity: 2.2,
        metalness: 0.2,roughness: 0.6
    });

    const greebleNeonBlueMat = new T.MeshStandardMaterial({
        color: 0x000000,emissive: neonBlue2,emissiveIntensity: 2.2,
        metalness: 0.2,roughness: 0.6
    });

    const neonRedRingMat = new T.MeshStandardMaterial({
        color: 0x000000,emissive: 0xff2a6d,emissiveIntensity: 2.4,
        metalness: 0.1,roughness: 0.5
    });


    const h = 38 * HEIGHT_SCALE;

    //base block
    const base = new T.Mesh(boxGeom, baseMat);
    base.scale.set(26, 5.5, 20);
    base.position.y = 2.75;
    enableShadows(base);
    root.add(base);

    //main industrial core
    const core = new T.Mesh(boxGeom, panelMat);
    core.scale.set(18, h, 14);
    core.position.y = h / 2 + 5.5;
    enableShadows(core);
    root.add(core);

    //upper machinery block
    const top = new T.Mesh(boxGeom, panelMat);
    top.scale.set(14, 8, 10);
    top.position.y = h + 11;
    enableShadows(top);
    root.add(top);

    //warning strip
    const warnStrip = new T.Mesh(boxGeom, warnMat);
    warnStrip.scale.set(20, 0.4, 0.6);
    warnStrip.position.set(0, h * 0.55 + 5.5, 8.1);
    enableShadows(warnStrip);
    root.add(warnStrip);

    //neon blue vertical strip
    const neonStrip = new T.Mesh(boxGeom, neonMat);
    neonStrip.scale.set(0.6, h * 0.9, 0.4);
    neonStrip.position.set(-9.3, h / 2 + 7.0, 7.2);
    enableShadows(neonStrip);
    root.add(neonStrip);

    //roof tanks + hollow neon rings
    for (let i = -1; i <= 1; i++) {
        const tank = new T.Mesh(cylGeom, steelMat);
        tank.scale.set(2.4, 3.8, 2.4);
        tank.position.set(i * 4.4, h + 15, 0);
        enableShadows(tank);
        root.add(tank);

        //hollow neon red torus ring on top
        const ringRadius = 2.7;    
        const tubeRadius = 0.12;   
        const ringGeom = new T.TorusGeometry(ringRadius, tubeRadius, 18, 64);

        const ring = new T.Mesh(ringGeom, neonRedRingMat);
        ring.rotation.x = Math.PI / 2;

        ring.position.set(i * 4.4, h + 15 + 3.8 / 2 + 0.10, 0);
        ring.castShadow = false;
        ring.receiveShadow = false;

        root.add(ring);
    }
    //front neon panel strips (red)
    for (let i = 0; i < 7; i++) {
        addPanelStrip(root, {
            material: greebleNeonRedMat,
            xStart: -8,
            xEnd: 8,
            y: 7 + i * ((h - 11) / 5), 
            z: 7.15,
            height: 0.7,
            thickness: 0.20,
            segments: 8
        });
    }
    //back neon panel strips (blue)
    for (let i = 0; i < 6; i++) {
        addPanelStrip(root, {
            material: greebleNeonBlueMat,
            xStart: -7,
            xEnd: 7,
            y: 8 + i * ((h - 16) / 3),
            z: -7.15,
            height: 0.28,
            thickness: 0.12,
            segments: 8
        });
    }

    //side modules
    for (let k = 0; k < 4; k++) {
        const m = new T.Mesh(boxGeom, panelMat);
        m.scale.set(6, 3.8, 5);
        m.position.set(11, 9 + k * 6, -6);
        enableShadows(m);
        root.add(m);
    }

    return root;
}

export class CyberTowerB3 extends GrObject {
    /**
     * @param {{plazaHeight?:number}} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();
        const plazaHeight = params.plazaHeight ?? 0.2;
        super("B3Towers", group);

        this._buildings = [];

        const boxGeom = new T.BoxGeometry(1, 1, 1);
        const cylGeom = new T.CylinderGeometry(1, 1, 1, 24);

        const towerCount = 5;
        const cityOuterR = 75;
        const angleOffset = Math.PI / towerCount; 

        for (let i = 0; i < towerCount; i++) {
            const angle = angleOffset + (i / towerCount) * Math.PI * 2;
            const x = Math.cos(angle) * cityOuterR;
            const z = Math.sin(angle) * cityOuterR;
            const tower = createBrutalistTower(plazaHeight, boxGeom, cylGeom);
            tower.position.set(x, 0, z);
            tower.rotation.y = Math.atan2(-x, -z);
            group.add(tower);
            this._buildings.push(tower);
        }
    }

    lookFromLookAt() {
        if (!this._buildings.length)
            return [70, 45, 70, 0, 12, 0];

        const center = new T.Vector3();
        const tmp = new T.Vector3();
        for (const b of this._buildings) {
            b.getWorldPosition(tmp);
            center.add(tmp);
        }
        center.multiplyScalar(1 / this._buildings.length);

        const dist = 140;
        const from = new T.Vector3(
            center.x + dist,
            center.y + dist * 0.65,
            center.z + dist
        );
        return [from.x, from.y, from.z, center.x, center.y, center.z];
    }

    stepWorld(delta, time) { }
}
