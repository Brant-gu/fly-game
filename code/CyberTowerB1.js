/* jshint esversion: 6 */
//@ts-check

//blade runner style tower ring

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

//height scale to avoid overly tall buildings
const HEIGHT_SCALE = 0.8;

/** enable cast and receive shadows for a mesh */
function enableShadows(m) {
    m.castShadow = true;
    m.receiveShadow = true;
}

/**
 * add a regular window grid on a wall
 * used for residential or office window lights
 */
function addWindowGrid(parent, opt) {
    const {
        material,
        centerX,
        baseY,
        z,
        floors,
        cols,
        dx,
        dy,
        w,
        h,
        randomOff = 0.15,
        offProb = 0.2
    } = opt;
    const geom = new T.BoxGeometry(1, 1, 1);
    for (let fy = 0; fy < floors; fy++) {
        const y = baseY + fy * dy;
        for (let cx = 0; cx < cols; cx++) {
            if (Math.random() < offProb) continue;
            const u = (cols === 1) ? 0 : (cx / (cols - 1) - 0.5);
            const win = new T.Mesh(geom, material);
            const jitterX = (Math.random() - 0.5) * randomOff;
            const jitterY = (Math.random() - 0.5) * randomOff * 0.5;
            win.scale.set(w, h, 0.1);
            win.position.set(centerX + u * dx + jitterX, y + jitterY, z);
            enableShadows(win);
            parent.add(win);
        }
    }
}

/**
 * add a horizontal strip of panels
 * used to break up large flat surfaces
 */
function addPanelStrip(parent, opt) {
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
        const w = Math.abs(x1 - x0);

        const p = new T.Mesh(geom, material);
        p.scale.set(w, height, thickness);
        p.position.set(cx, y, z);
        enableShadows(p);
        parent.add(p);
    }
}

/**
 * add vertical grooves on a wall
 * used for concrete or metal expansion joints
 */
function addVerticalGrooves(parent, opt) {
    const {
        material,
        xCenter,
        z,
        yBottom,
        yTop,
        count,
        spacing,
        width = 0.15,
        depth = 0.1
    } = opt;
    const geom = new T.BoxGeometry(1, 1, 1);
    const h = yTop - yBottom;
    for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * spacing;
        const g = new T.Mesh(geom, material);
        g.scale.set(width, h, depth);
        g.position.set(xCenter + offset, yBottom + h / 2, z);
        enableShadows(g);
        parent.add(g);
    }
}

/**
 * scatter greebles on a rectangular wall region
 * used to create dense industrial details at close range
 */
function addGreeblesOnWall(parent, opt) {
    const {
        material,
        xMin,
        xMax,
        yMin,
        yMax,
        z,
        count,
        minSize = new T.Vector2(0.4, 0.3), //w,h
        maxSize = new T.Vector2(1.6, 1.2),
        depth = 0.2
    } = opt;

    const boxGeom = new T.BoxGeometry(1, 1, 1);
    const stripGeom = new T.BoxGeometry(1, 1, 1);

    for (let i = 0; i < count; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const y = yMin + Math.random() * (yMax - yMin);

        //80% small boxes, 20% long strips
        if (Math.random() < 0.8) {
            const w = minSize.x + Math.random() * (maxSize.x - minSize.x);
            const h = minSize.y + Math.random() * (maxSize.y - minSize.y);
            const g = new T.Mesh(boxGeom, material);
            g.scale.set(w, h, depth * (0.6 + Math.random() * 0.8));
            g.position.set(
                x,
                y,
                z + (Math.random() - 0.5) * 0.05
            );
            g.rotation.z = (Math.random() - 0.5) * 0.18;
            enableShadows(g);
            parent.add(g);
        } else {
            //long panel strips, slightly tilted
            const w = (minSize.x + Math.random() * (maxSize.x - minSize.x)) * 2.5;
            const h = (minSize.y + Math.random() * (maxSize.y - minSize.y)) * 0.6;
            const s = new T.Mesh(stripGeom, material);
            s.scale.set(w, h, depth * 0.7);
            s.position.set(
                x,
                y,
                z + (Math.random() - 0.5) * 0.05
            );
            s.rotation.z = (Math.random() - 0.5) * 0.12;
            enableShadows(s);
            parent.add(s);
        }
    }
}

/**
 * create one blade runner style tower
 * only sets local y, x/z and rotation are set by caller
 */
function createBladeRunnerTower(plazaHeight, boxGeom, cylGeom) {
    const root = new T.Group();
    root.position.y = plazaHeight;

    // === unified wall material (everything except windows) ===
    const wallMat = new T.MeshStandardMaterial({
        color: 0x1a1f2a,        // change this to whatever unified color you prefer
        metalness: 0.75,
        roughness: 0.42,
        emissive: 0x020304,
        emissiveIntensity: 0.15
    });

    const windowWarm = new T.Color(0xfff0b0);

    const windowMat = new T.MeshStandardMaterial({
        color: 0x000000,
        emissive: windowWarm,
        emissiveIntensity: 1.35,
        metalness: 0.12,
        roughness: 0.3
    });

    const h = 34 * HEIGHT_SCALE;

    // main tower body
    const main = new T.Mesh(boxGeom, wallMat);
    main.scale.set(10, h, 6);
    main.position.y = h / 2;
    enableShadows(main);
    root.add(main);

    // offset side block
    const sec = new T.Mesh(boxGeom, wallMat);
    sec.scale.set(6, h * 0.7, 4.5);
    sec.position.set(-5.2, h * 0.6, -0.4);
    enableShadows(sec);
    root.add(sec);

    // top mechanical floor
    const mech = new T.Mesh(boxGeom, wallMat);
    mech.scale.set(7.2, 2.2, 4.2);
    mech.position.set(1.0, h + 1.1, 0);
    enableShadows(mech);
    root.add(mech);

    // roof (same wallMat now)
    const roof = new T.Mesh(boxGeom, wallMat);
    roof.scale.set(7.4, 1.0, 4.6);
    roof.position.set(1.0, h + 2.1, -0.4);
    roof.rotation.x = -Math.PI / 16;
    enableShadows(roof);
    root.add(roof);

    // vents + cooling tower (same wallMat now)
    for (let i = -1; i <= 1; i++) {
        const vent = new T.Mesh(boxGeom, wallMat);
        vent.scale.set(1.4, 0.8, 1.2);
        vent.position.set(1 + i * 2.4, h + 2.4, 0.7);
        enableShadows(vent);
        root.add(vent);
    }
    const coolTower = new T.Mesh(cylGeom, wallMat);
    coolTower.scale.set(1.3, 2.2, 1.3);
    coolTower.position.set(-2.5, h + 2.4, -1.0);
    enableShadows(coolTower);
    root.add(coolTower);

    // frames (same wallMat now)
    const frameGeom = new T.BoxGeometry(1, 1, 1);
    const frameCols = 3;

    for (let i = 0; i < frameCols; i++) {
        const u = (frameCols === 1) ? 0 : (i / (frameCols - 1) - 0.5);
        const col = new T.Mesh(frameGeom, wallMat);
        col.scale.set(0.5, h * 1.02, 0.6);
        col.position.set(u * 7.8, h / 2, 3.35);
        enableShadows(col);
        root.add(col);
    }
    const beamTop = new T.Mesh(frameGeom, wallMat);
    beamTop.scale.set(9, 0.7, 0.6);
    beamTop.position.set(0, h + 0.4, 3.35);
    enableShadows(beamTop);
    root.add(beamTop);

    for (let i = 0; i < frameCols; i++) {
        const u = (frameCols === 1) ? 0 : (i / (frameCols - 1) - 0.5);
        const col = new T.Mesh(frameGeom, wallMat);
        col.scale.set(0.5, h * 1.02, 0.6);
        col.position.set(u * 7.8, h / 2, -3.35);
        enableShadows(col);
        root.add(col);
    }
    const beamTopBack = new T.Mesh(frameGeom, wallMat);
    beamTopBack.scale.set(9, 0.7, 0.6);
    beamTopBack.position.set(0, h + 0.4, -3.35);
    enableShadows(beamTopBack);
    root.add(beamTopBack);

    // windows (keep as-is)
    addWindowGrid(root, {
        material: windowMat,
        centerX: 0,
        baseY: 4,
        z: 3.02,
        floors: 10,
        cols: 10,
        dx: 9,
        dy: 1.9,
        w: 0.7,
        h: 0.5,
        randomOff: 0.3,
        offProb: 0.28
    });
    addWindowGrid(root, {
        material: windowMat,
        centerX: 0,
        baseY: 4,
        z: -3.02,
        floors: 10,
        cols: 10,
        dx: 9,
        dy: 1.9,
        w: 0.7,
        h: 0.5,
        randomOff: 0.3,
        offProb: 0.28
    });

    // balconies + rails + lamps (all use wallMat now; if you want the lamp emissive to keep glowing, create a separate lightMat)
    const balconyGeom = new T.BoxGeometry(1, 1, 1);
    const balconyLevels = [7, 12, 17, 22, 27];
    balconyLevels.forEach((yy) => {
        const b = new T.Mesh(balconyGeom, wallMat);
        b.scale.set(3.2, 0.4, 1.3);
        b.position.set(5.4, yy, 2.4);
        enableShadows(b);
        root.add(b);

        const rail = new T.Mesh(balconyGeom, wallMat);
        rail.scale.set(3.2, 0.25, 0.1);
        rail.position.set(5.4, yy + 0.8, 3.0);
        enableShadows(rail);
        root.add(rail);

        const lamp = new T.Mesh(balconyGeom, wallMat);
        lamp.scale.set(0.5, 0.3, 0.1);
        lamp.position.set(5.4, yy - 0.6, 3.02);
        enableShadows(lamp);
        root.add(lamp);
    });

    // greebles: if you keep the front face, also use wallMat
    // addGreeblesOnWall(... material: wallMat ...)

    return root;
}


export class CyberTowerB1 extends GrObject {
    /**
     * @param {{ plazaHeight?: number }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();
        const plazaHeight = params.plazaHeight ?? 0.2;
        super("B1Towers", group);

        /** @type {T.Object3D[]} */
        this._buildings = [];

        const boxGeom = new T.BoxGeometry(1, 1, 1);
        const cylGeom = new T.CylinderGeometry(1, 1, 1, 24);

        const towerCount = 5;

        const R1 = 35;

        const angleOffset = Math.PI / towerCount;

        for (let i = 0; i < towerCount; i++) {
            const angle = angleOffset + (i / towerCount) * Math.PI * 2;

            const x = Math.cos(angle) * R1;
            const z = Math.sin(angle) * R1;

            const towerRoot = createBladeRunnerTower(plazaHeight, boxGeom, cylGeom);
            towerRoot.position.set(x, 0, z);

            towerRoot.rotation.y = Math.atan2(-x, -z);

            group.add(towerRoot);
            this._buildings.push(towerRoot);
        }


        this._time = 0;
    }

    /** default camera view: bird eye over ring of towers */
    lookFromLookAt() {
        if (!this._buildings || this._buildings.length === 0) {
            return [75, 45, 75, 0, 10, 0];
        }

        const center = new T.Vector3();
        const tmp = new T.Vector3();
        let count = 0;

        for (const b of this._buildings) {
            if (!b) continue;
            b.getWorldPosition(tmp);
            center.add(tmp);
            count++;
        }
        if (count === 0) {
            return [75, 45, 75, 0, 10, 0];
        }
        center.multiplyScalar(1 / count);

        const dist = 120;
        const from = new T.Vector3(
            center.x + dist,
            center.y + dist * 0.6,
            center.z + dist
        );

        return [from.x, from.y, from.z, center.x, center.y, center.z];
    }

    /** no animation by design */
    stepWorld(delta, timeOfDay) {
        //no-op
    }
}
