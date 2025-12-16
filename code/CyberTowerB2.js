/* jshint esversion: 6 */
//@ts-check

//cyberpunk 2077 style modular mega towers

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
 * create one cyberpunk modular mega tower
 * only sets local y, x/z and rotation are set by caller
 */
function createModularTower(plazaHeight, boxGeom, cylGeom, torusGeom) {
    const root = new T.Group();
    root.position.y = plazaHeight;

    const baseColor  = new T.Color(0x2a3a55); // cool blue steel
    const blockColor = new T.Color(0x32445f); // main block
    const accentCyan = new T.Color(0x32f5ff);
    const accentMagenta = new T.Color(0xff4cff);
    const windowCool = new T.Color(0xa8e5ff);

    const baseMat = new T.MeshStandardMaterial({
        color: baseColor,metalness: 0.65,roughness: 0.45,
        emissive: 0x04070c,emissiveIntensity: 0.25
    });

    const towerMat = new T.MeshStandardMaterial({
        color: blockColor,metalness: 0.75,roughness: 0.38,
        emissive: 0x04070c,emissiveIntensity: 0.22
    });


    baseMat.emissive = new T.Color(0x05070a);
    baseMat.emissiveIntensity = 0.4;

    towerMat.emissive = new T.Color(0x05070a);
    towerMat.emissiveIntensity = 0.4;

    const modMat = towerMat.clone();
    modMat.roughness = 0.33;

    const stripGeom = new T.BoxGeometry(1, 1, 1);
    const cyanStripMat = new T.MeshStandardMaterial({
        color: 0x000000,emissive: accentCyan,emissiveIntensity: 2.1,
        metalness: 0.4,roughness: 0.2
    });
    const magentaStripMat = new T.MeshStandardMaterial({
        color: 0x000000,emissive: accentMagenta,emissiveIntensity: 2.1,
        metalness: 0.4,roughness: 0.2
    });

    const windowMat2 = new T.MeshStandardMaterial({
        color: 0x000000,emissive: windowCool,emissiveIntensity: 1.6,
        metalness: 0.15,roughness: 0.32
    });

    const greebleMat2 = new T.MeshStandardMaterial({
        color: 0x262b36,metalness: 0.65,
        roughness: 0.5,emissive: 0x000000
    });

    const panelStripMat2 = new T.MeshStandardMaterial({
        color: 0x181d26,metalness: 0.7,
        roughness: 0.45,emissive: 0x000000
    });

    const balconyMat2 = new T.MeshStandardMaterial({
        color: 0x141922,metalness: 0.7,
        roughness: 0.4,emissive: 0x000000
    });
    const railMat2 = new T.MeshStandardMaterial({
        color: 0xb0b7c4,metalness: 0.85,
        roughness: 0.25,emissive: 0x000000
    });

    const unitMat = new T.MeshStandardMaterial({
        color: 0x20242b,metalness: 0.7,
        roughness: 0.5,emissive: 0x000000
    });

    const neonColGeom = new T.BoxGeometry(1, 1, 1);
    const neonCyanMat = new T.MeshStandardMaterial({
        color: 0x000000,emissive: accentCyan,
        emissiveIntensity: 2.4,metalness: 0.35,roughness: 0.18
    });
    const neonMagentaMat = new T.MeshStandardMaterial({
        color: 0x000000,emissive: accentMagenta,
        emissiveIntensity: 2.4,metalness: 0.35,roughness: 0.18
    });

    const h2 = 30 * HEIGHT_SCALE;

    //base block
    const base = new T.Mesh(boxGeom, baseMat);
    base.scale.set(22, 4, 18);
    base.position.y = 2;
    enableShadows(base);
    root.add(base);

    //main tower body
    const tower = new T.Mesh(boxGeom, towerMat);
    tower.scale.set(12, h2, 8);
    tower.position.set(-1.5, h2 / 2 + 4, -1);
    enableShadows(tower);
    root.add(tower);

    //suspended module
    const mod = new T.Mesh(boxGeom, modMat);
    mod.scale.set(8.5, h2 * 0.6, 6);
    mod.position.set(7.5, h2 * 0.55 + 4, 3.2);
    enableShadows(mod);
    root.add(mod);

    //structural braces
    const braceMat = new T.MeshStandardMaterial({
        color: 0x0c0e12,
        metalness: 0.9,
        roughness: 0.28,
        emissive: 0x000000
    });
    for (let s = -1; s <= 1; s += 2) {
        const brace = new T.Mesh(cylGeom, braceMat);
        brace.scale.set(0.45, 9, 0.45);
        brace.position.set(2.0, 10, 0.5 + s * 3.2);
        brace.rotation.z = Math.PI / 4 * s;
        enableShadows(brace);
        root.add(brace);
    }

    //high saturation neon strips front and back
    const stripLevels = [0.22, 0.48, 0.74];
    //front
    stripLevels.forEach((lv, idx) => {
        const mat = idx % 2 === 0 ? cyanStripMat : magentaStripMat;
        const s = new T.Mesh(stripGeom, mat);
        s.scale.set(12.8, 0.35, 0.2);
        s.position.set(-1.5, 4 + h2 * lv, 4.3);
        enableShadows(s);
        root.add(s);
    });
    //back
    stripLevels.forEach((lv, idx) => {
        if (idx === 1) return;
        const mat = idx % 2 === 0 ? cyanStripMat : magentaStripMat;
        const s = new T.Mesh(stripGeom, mat);
        s.scale.set(10.5, 0.3, 0.2);
        s.position.set(-1.5, 4 + h2 * lv, -4.3);
        enableShadows(s);
        root.add(s);
    });

    //vertical neon columns at four corners
    const colHeight = h2 * 0.95;
    const yCol = 4 + colHeight / 2;
    const neonCols = [
        { mat: neonCyanMat, x: -6.2, z: 4.1 },
        { mat: neonMagentaMat, x: 3.2, z: 4.1 },
        { mat: neonCyanMat, x: -6.2, z: -4.1 },
        { mat: neonMagentaMat, x: 3.2, z: -4.1 }
    ];
    neonCols.forEach((nc) => {
        const c = new T.Mesh(neonColGeom, nc.mat);
        c.scale.set(0.35, colHeight, 0.25);
        c.position.set(nc.x, yCol, nc.z);
        enableShadows(c);
        root.add(c);
    });

    //window grid front and back
    addWindowGrid(root, {
        material: windowMat2,
        centerX: -1.5,
        baseY: 6,
        z: 4.08,
        floors: 9,
        cols: 9,
        dx: 10.0,
        dy: 1.9,
        w: 0.7,
        h: 0.5,
        randomOff: 0.3,
        offProb: 0.22
    });
    addWindowGrid(root, {
        material: windowMat2,
        centerX: -1.5,
        baseY: 6,
        z: -6.08,
        floors: 9,
        cols: 9,
        dx: 10.0,
        dy: 1.9,
        w: 0.7,
        h: 0.5,
        randomOff: 0.3,
        offProb: 0.28
    });

    //panel strips front and back
    const yStripLevels = [];
    for (let k = 0; k < 6; k++) yStripLevels.push(5 + k * 3.2);
    yStripLevels.forEach((yy) => {
        addPanelStrip(root, {
            material: panelStripMat2,
            xStart: -6.0,
            xEnd: 3.0,
            y: yy,
            z: 3.8,
            height: 0.3,
            segments: 7
        });
    });
    yStripLevels.forEach((yy) => {
        addPanelStrip(root, {
            material: panelStripMat2,
            xStart: -6.0,
            xEnd: 3.0,
            y: yy,
            z: -5.8,
            height: 0.3,
            segments: 7
        });
    });

    //module balcony strips
    const balconyGeom2 = new T.BoxGeometry(1, 1, 1);
    const railGeom2 = new T.BoxGeometry(1, 1, 1);
    const modY0 = 4 + h2 * 0.5;
    for (let k = 0; k < 4; k++) {
        const yy = modY0 + k * 1.6;
        const b = new T.Mesh(balconyGeom2, balconyMat2);
        b.scale.set(6.5, 0.35, 1.6);
        b.position.set(7.5, yy, 6.2);
        enableShadows(b);
        root.add(b);

        const rail = new T.Mesh(railGeom2, railMat2);
        rail.scale.set(6.5, 0.25, 0.12);
        rail.position.set(7.5, yy + 0.65, 6.9);
        enableShadows(rail);
        root.add(rail);
    }

    //base units and small lamps at the front
    for (let k = -2; k <= 2; k++) {
        const u = new T.Mesh(boxGeom, unitMat);
        u.scale.set(1.6, 1.0, 1.0);
        u.position.set(-10 + k * 4, 2.5, 9.3);
        enableShadows(u);
        root.add(u);

        const lampMat = new T.MeshStandardMaterial({
            color: 0x000000,
            emissive: k % 2 === 0 ? accentCyan : accentMagenta,
            emissiveIntensity: 1.4,
            metalness: 0.3,
            roughness: 0.3
        });
        const lamp = new T.Mesh(boxGeom, lampMat);
        lamp.scale.set(0.4, 0.3, 0.1);
        lamp.position.set(-10 + k * 4, 1.8, 9.01);
        enableShadows(lamp);
        root.add(lamp);
    }

    //roof pad and hover ring
    const padMat = towerMat.clone();
    const pad = new T.Mesh(boxGeom, padMat);
    pad.scale.set(9, 0.6, 6);
    pad.position.set(-1.5, 4 + h2 + 0.5, -1.0);
    enableShadows(pad);
    root.add(pad);

    const ringMat = new T.MeshStandardMaterial({
        color: 0x000000,
        emissive: accentCyan.clone().multiplyScalar(1.6),
        emissiveIntensity: 1.8,
        metalness: 0.6,
        roughness: 0.2
    });
    const hoverRing = new T.Mesh(torusGeom, ringMat);
    hoverRing.scale.set(3.2, 3.2, 1);
    hoverRing.rotation.x = Math.PI / 2;
    hoverRing.position.set(-1.5, 4 + h2 + 1.4, -1.0);
    root.add(hoverRing);

    //greebles front and back
    addGreeblesOnWall(root, {
        material: greebleMat2,
        xMin: -6.0,
        xMax: 3.0,
        yMin: 5.0,
        yMax: 4 + h2 - 3.0,
        z: 3.95,
        count: 42,
        minSize: new T.Vector2(0.5, 0.4),
        maxSize: new T.Vector2(1.8, 1.2),
        depth: 0.28
    });
    addGreeblesOnWall(root, {
        material: greebleMat2,
        xMin: -6.0,
        xMax: 3.0,
        yMin: 5.0,
        yMax: 4 + h2 - 3.0,
        z: -3.95,
        count: 36,
        minSize: new T.Vector2(0.5, 0.4),
        maxSize: new T.Vector2(1.8, 1.2),
        depth: 0.28
    });

    return root;
}

export class CyberTowerB2 extends GrObject {
    /**
     * @param {{ plazaHeight?: number }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();
        const plazaHeight = params.plazaHeight ?? 0.2;
        super("B2Towers", group);

        /** @type {T.Object3D[]} */
        this._buildings = [];

        const boxGeom = new T.BoxGeometry(1, 1, 1);
        const cylGeom = new T.CylinderGeometry(1, 1, 1, 24);
        const torusGeom = new T.TorusGeometry(1, 0.08, 12, 24);

        const towerCount = 5;
        const R3 = 95;
        const R2 = 55;
        const angleOffset = Math.PI / towerCount;
        const stagger = Math.PI * 2 / towerCount / 2;

        for (let i = 0; i < towerCount; i++) {
            const angle = angleOffset + stagger + (i / towerCount) * Math.PI * 2;

            const x = Math.cos(angle) * R2;
            const z = Math.sin(angle) * R2;

            const towerRoot = createModularTower(plazaHeight, boxGeom, cylGeom, torusGeom);
            towerRoot.position.set(x, 0, z);

            towerRoot.rotation.y = Math.atan2(-x, -z) + Math.PI / 18;

            group.add(towerRoot);
            this._buildings.push(towerRoot);
        }


        this._time = 0;
    }

    /** default camera view: bird eye over modular towers */
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
