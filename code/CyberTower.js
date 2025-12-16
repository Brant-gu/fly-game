/* jshint esversion: 6 */
//@ts-check

//three detailed cyberpunk buildings:
//b1: blade runner style highrise (5 copies around center)
//b2: cyberpunk 2077 style modular mega tower
//b3: akira style concrete megastructure
//
//features:
//- facade details: windows, panels, greebles, pipes
//- no billboards, no color cycling, no rotation animation
//- uses static lighting and emissive for cyber feeling

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
 * add one industrial pipe between two points
 */
function addPipe(parent, opt) {
    const { material, from, to, radius = 0.2 } = opt;
    const dir = new T.Vector3().subVectors(to, from);
    const len = dir.length();
    if (len < 1e-4) return;
    dir.normalize();

    const geom = new T.CylinderGeometry(radius, radius, 1, 16);
    const pipe = new T.Mesh(geom, material);
    pipe.scale.set(1, len, 1);

    const mid = new T.Vector3().addVectors(from, to).multiplyScalar(0.5);
    pipe.position.copy(mid);

    const up = new T.Vector3(0, 1, 0);
    const quat = new T.Quaternion().setFromUnitVectors(up, dir);
    pipe.quaternion.copy(quat);

    enableShadows(pipe);
    parent.add(pipe);
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

    const baseColor = new T.Color(0x1a1f2a);
    const panelColor = new T.Color(0x262e3a);
    const frameColor = new T.Color(0x0b0d11);
    const windowWarm = new T.Color(0xfff0b0);
    const serviceGrey = new T.Color(0x444c58);

    const towerMat = new T.MeshStandardMaterial({
        color: baseColor,
        metalness: 0.7,
        roughness: 0.42,
        emissive: 0x04070a,
        emissiveIntensity: 0.3
    });
    const h = 34 * HEIGHT_SCALE;

    //main tower body
    const main = new T.Mesh(boxGeom, towerMat);
    main.scale.set(10, h, 6);
    main.position.y = h / 2;
    enableShadows(main);
    root.add(main);

    //offset side block
    const secMat = new T.MeshStandardMaterial({
        color: panelColor,
        metalness: 0.65,
        roughness: 0.5,
        emissive: 0x020304,
        emissiveIntensity: 0.25
    });
    const sec = new T.Mesh(boxGeom, secMat);
    sec.scale.set(6, h * 0.7, 4.5);
    sec.position.set(-5.2, h * 0.6, -0.4);
    enableShadows(sec);
    root.add(sec);

    //top mechanical floor and sloped roof
    const mech = new T.Mesh(boxGeom, secMat);
    mech.scale.set(7.2, 2.2, 4.2);
    mech.position.set(1.0, h + 1.1, 0);
    enableShadows(mech);
    root.add(mech);

    const roofMat = new T.MeshStandardMaterial({
        color: frameColor,
        metalness: 0.88,
        roughness: 0.33,
        emissive: 0x05070a,
        emissiveIntensity: 0.3
    });
    const roof = new T.Mesh(boxGeom, roofMat);
    roof.scale.set(7.4, 1.0, 4.6);
    roof.position.set(1.0, h + 2.1, -0.4);
    roof.rotation.x = -Math.PI / 16;
    enableShadows(roof);
    root.add(roof);

    //roof vents and cooling tower
    const ventMat = new T.MeshStandardMaterial({
        color: serviceGrey,
        metalness: 0.55,
        roughness: 0.45,
        emissive: 0x000000,
        emissiveIntensity: 0.0
    });
    for (let i = -1; i <= 1; i++) {
        const vent = new T.Mesh(boxGeom, ventMat);
        vent.scale.set(1.4, 0.8, 1.2);
        vent.position.set(1 + i * 2.4, h + 2.4, 0.7);
        enableShadows(vent);
        root.add(vent);
    }
    const coolTower = new T.Mesh(cylGeom, ventMat);
    coolTower.scale.set(1.3, 2.2, 1.3);
    coolTower.position.set(-2.5, h + 2.4, -1.0);
    enableShadows(coolTower);
    root.add(coolTower);

    //front structural frame
    const frameMat = new T.MeshStandardMaterial({
        color: frameColor,
        metalness: 0.9,
        roughness: 0.3,
        emissive: 0x000000,
        emissiveIntensity: 0.0
    });
    const frameGeom = new T.BoxGeometry(1, 1, 1);
    const frameCols = 3;
    for (let i = 0; i < frameCols; i++) {
        const u = (frameCols === 1) ? 0 : (i / (frameCols - 1) - 0.5);
        const col = new T.Mesh(frameGeom, frameMat);
        col.scale.set(0.5, h * 1.02, 0.6);
        col.position.set(u * 7.8, h / 2, 3.35);
        enableShadows(col);
        root.add(col);
    }
    const beamTop = new T.Mesh(frameGeom, frameMat);
    beamTop.scale.set(9, 0.7, 0.6);
    beamTop.position.set(0, h + 0.4, 3.35);
    enableShadows(beamTop);
    root.add(beamTop);

    //back structural frame
    for (let i = 0; i < frameCols; i++) {
        const u = (frameCols === 1) ? 0 : (i / (frameCols - 1) - 0.5);
        const col = new T.Mesh(frameGeom, frameMat);
        col.scale.set(0.5, h * 1.02, 0.6);
        col.position.set(u * 7.8, h / 2, -3.35);
        enableShadows(col);
        root.add(col);
    }
    const beamTopBack = new T.Mesh(frameGeom, frameMat);
    beamTopBack.scale.set(9, 0.7, 0.6);
    beamTopBack.position.set(0, h + 0.4, -3.35);
    enableShadows(beamTopBack);
    root.add(beamTopBack);

    //horizontal panel strips front and back
    const panelStripMat = new T.MeshStandardMaterial({
        color: 0x151821,
        metalness: 0.65,
        roughness: 0.45,
        emissive: 0x000000,
        emissiveIntensity: 0.0
    });
    const yLevels = [];
    for (let i = 0; i < 7; i++) yLevels.push(3 + i * 4.0);
    //front
    yLevels.forEach((yy) => {
        addPanelStrip(root, {
            material: panelStripMat,
            xStart: -4.5,
            xEnd: 4.5,
            y: yy,
            z: 3.1,
            height: 0.3,
            segments: 7
        });
    });
    //back
    yLevels.forEach((yy) => {
        addPanelStrip(root, {
            material: panelStripMat,
            xStart: -4.5,
            xEnd: 4.5,
            y: yy,
            z: -3.1,
            height: 0.3,
            segments: 7
        });
    });

    //vertical grooves front and back
    const grooveMat = new T.MeshStandardMaterial({
        color: 0x090a0d,
        metalness: 0.4,
        roughness: 0.6,
        emissive: 0x000000,
        emissiveIntensity: 0.0
    });
    //front
    addVerticalGrooves(root, {
        material: grooveMat,
        xCenter: 0,
        z: 3.05,
        yBottom: 2.5,
        yTop: h - 1.5,
        count: 4,
        spacing: 2.3
    });
    //back
    addVerticalGrooves(root, {
        material: grooveMat,
        xCenter: 0,
        z: -3.05,
        yBottom: 2.5,
        yTop: h - 1.5,
        count: 4,
        spacing: 2.3
    });

    //window lights front and back
    const windowMat = new T.MeshStandardMaterial({
        color: 0x000000,
        emissive: windowWarm,
        emissiveIntensity: 1.35,
        metalness: 0.12,
        roughness: 0.3
    });
    //front
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
    //back
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

    //industrial balconies and down lights on one side
    const balconyMat = new T.MeshStandardMaterial({
        color: 0x222832,
        metalness: 0.72,
        roughness: 0.4,
        emissive: 0x000000,
        emissiveIntensity: 0.0
    });
    const railMat = new T.MeshStandardMaterial({
        color: 0xb0b7c4,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x000000,
        emissiveIntensity: 0.0
    });
    const balconyGeom = new T.BoxGeometry(1, 1, 1);
    const railGeom = new T.BoxGeometry(1, 1, 1);
    const balconyLevels = [7, 12, 17, 22, 27];
    balconyLevels.forEach((yy) => {
        const b = new T.Mesh(balconyGeom, balconyMat);
        b.scale.set(3.2, 0.4, 1.3);
        b.position.set(5.4, yy, 2.4);
        enableShadows(b);
        root.add(b);

        const rail = new T.Mesh(railGeom, railMat);
        rail.scale.set(3.2, 0.25, 0.1);
        rail.position.set(5.4, yy + 0.8, 3.0);
        enableShadows(rail);
        root.add(rail);

        const lampMat = new T.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0xfff2c2,
            emissiveIntensity: 1.1,
            metalness: 0.2,
            roughness: 0.4
        });
        const lamp = new T.Mesh(balconyGeom, lampMat);
        lamp.scale.set(0.5, 0.3, 0.1);
        lamp.position.set(5.4, yy - 0.6, 3.02);
        enableShadows(lamp);
        root.add(lamp);
    });

    //greeble details front and back
    const greebleMat = new T.MeshStandardMaterial({
        color: 0x2b313a,
        metalness: 0.65,
        roughness: 0.5,
        emissive: 0x000000,
        emissiveIntensity: 0.0
    });
    //front
    addGreeblesOnWall(root, {
        material: greebleMat,
        xMin: -4.3,
        xMax: 4.3,
        yMin: 3.0,
        yMax: h - 3.0,
        z: 2.95,
        count: 55,
        minSize: new T.Vector2(0.5, 0.35),
        maxSize: new T.Vector2(1.6, 1.1),
        depth: 0.3
    });
    //back
    addGreeblesOnWall(root, {
        material: greebleMat,
        xMin: -4.3,
        xMax: 4.3,
        yMin: 3.0,
        yMax: h - 3.0,
        z: -2.95,
        count: 55,
        minSize: new T.Vector2(0.5, 0.35),
        maxSize: new T.Vector2(1.6, 1.1),
        depth: 0.3
    });

    return root;
}

export class CyberTower extends GrObject {
    /**
     * @param {{ plazaHeight?: number }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();
        const plazaHeight = params.plazaHeight ?? 0.2;
        super("CyberTowers", group);

        /** @type {T.Object3D[]} */
        this._buildings = [];

        const boxGeom = new T.BoxGeometry(1, 1, 1);
        const cylGeom = new T.CylinderGeometry(1, 1, 1, 24);
        const torusGeom = new T.TorusGeometry(1, 0.08, 12, 24);

        //========== b1: blade runner style ring of towers ==========
        {
            const towerCount = 5;

            //random positions in a ring band region
            const minR = 50;
            const maxR = 90;

            //minimum distance between towers to avoid overlap
            const minDist = 18;

            /** stored tower positions for spacing check */
            /** @type {{x:number, z:number}[]} */
            const placed = [];

            for (let i = 0; i < towerCount; i++) {
                let pos = null;

                //try a few times to find a position far enough from others
                for (let attempt = 0; attempt < 30; attempt++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = minR + Math.random() * (maxR - minR);

                    const x = Math.cos(angle) * r;
                    const z = Math.sin(angle) * r;

                    let ok = true;
                    for (const p of placed) {
                        const dx = x - p.x;
                        const dz = z - p.z;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        if (dist < minDist) {
                            ok = false;
                            break;
                        }
                    }

                    if (ok) {
                        pos = { x, z };
                        break;
                    }
                }

                //fallback evenly on a circle if random placement fails
                if (!pos) {
                    const angle = (i / towerCount) * Math.PI * 2;
                    const r = (minR + maxR) * 0.5;
                    pos = {
                        x: Math.cos(angle) * r,
                        z: Math.sin(angle) * r
                    };
                }

                const towerRoot = createBladeRunnerTower(plazaHeight, boxGeom, cylGeom);
                towerRoot.position.x = pos.x;
                towerRoot.position.z = pos.z;

                //orient each tower roughly facing city center
                //vector to center (0,0) from tower is (-x, -z)
                const angleToCenter = Math.atan2(-pos.x, -pos.z);
                towerRoot.rotation.y = angleToCenter;

                group.add(towerRoot);
                this._buildings.push(towerRoot);
                placed.push(pos);
            }
        }

        //========== b2: modular mega towers with neon strips ==========
        {
            const towerCount = 5;

            //ring band for b2: outer city ring
            const minR = 45;
            const maxR = 65;

            //minimum distance between b2 towers
            const minDist = 28;

            /** stored b2 tower positions for spacing check */
            /** @type {{x:number, z:number}[]} */
            const placedB2 = [];

            //shared color scheme for b2
            const baseColor = new T.Color(0x181c28);
            const blockColor = new T.Color(0x242c38);
            const accentCyan = new T.Color(0x32f5ff);
            const accentMagenta = new T.Color(0xff4cff);
            const windowCool = new T.Color(0xa8e5ff);

            for (let i = 0; i < towerCount; i++) {
                //1. random placement with spacing check
                let pos = null;

                for (let attempt = 0; attempt < 40; attempt++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = minR + Math.random() * (maxR - minR);

                    const x = Math.cos(angle) * r;
                    const z = Math.sin(angle) * r;

                    let ok = true;
                    for (const p of placedB2) {
                        const dx = x - p.x;
                        const dz = z - p.z;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        if (dist < minDist) {
                            ok = false;
                            break;
                        }
                    }
                    if (ok) {
                        pos = { x, z };
                        break;
                    }
                }

                //fallback evenly on circle if random placement fails
                if (!pos) {
                    const fallbackAngle = (i / towerCount) * Math.PI * 2;
                    const r = (minR + maxR) * 0.5;
                    pos = {
                        x: Math.cos(fallbackAngle) * r,
                        z: Math.sin(fallbackAngle) * r
                    };
                }

                const root = new T.Group();
                root.position.set(pos.x, plazaHeight, pos.z);

                //face roughly toward city center with a slight offset
                const angleToCenter = Math.atan2(-pos.x, -pos.z);
                root.rotation.y = angleToCenter + Math.PI / 18;

                //2. materials

                const baseMat = new T.MeshStandardMaterial({
                    color: baseColor,
                    metalness: 0.75,
                    roughness: 0.45,
                    emissive: 0x020305,
                    emissiveIntensity: 0.25
                });

                //dark cyber wall
                const towerMat = new T.MeshStandardMaterial({
                    color: blockColor,
                    metalness: 0.88,
                    roughness: 0.42,
                    emissive: 0x020309,
                    emissiveIntensity: 0.22
                });

                //suspended modules use similar wall material
                const modMat = towerMat.clone();
                modMat.roughness = 0.33;

                //neon strip materials
                const stripGeom = new T.BoxGeometry(1, 1, 1);
                const cyanStripMat = new T.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: accentCyan,
                    emissiveIntensity: 2.1,
                    metalness: 0.4,
                    roughness: 0.2
                });
                const magentaStripMat = new T.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: accentMagenta,
                    emissiveIntensity: 2.1,
                    metalness: 0.4,
                    roughness: 0.2
                });

                //window material
                const windowMat2 = new T.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: windowCool,
                    emissiveIntensity: 1.6,
                    metalness: 0.15,
                    roughness: 0.32
                });

                //greeble and panel materials
                const greebleMat2 = new T.MeshStandardMaterial({
                    color: 0x262b36,
                    metalness: 0.65,
                    roughness: 0.5,
                    emissive: 0x000000
                });

                const panelStripMat2 = new T.MeshStandardMaterial({
                    color: 0x181d26,
                    metalness: 0.7,
                    roughness: 0.45,
                    emissive: 0x000000
                });

                const balconyMat2 = new T.MeshStandardMaterial({
                    color: 0x141922,
                    metalness: 0.7,
                    roughness: 0.4,
                    emissive: 0x000000
                });
                const railMat2 = new T.MeshStandardMaterial({
                    color: 0xb0b7c4,
                    metalness: 0.85,
                    roughness: 0.25,
                    emissive: 0x000000
                });

                const unitMat = new T.MeshStandardMaterial({
                    color: 0x20242b,
                    metalness: 0.7,
                    roughness: 0.5,
                    emissive: 0x000000
                });

                const neonColGeom = new T.BoxGeometry(1, 1, 1);
                const neonCyanMat = new T.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: accentCyan,
                    emissiveIntensity: 2.4,
                    metalness: 0.35,
                    roughness: 0.18
                });
                const neonMagentaMat = new T.MeshStandardMaterial({
                    color: 0x000000,
                    emissive: accentMagenta,
                    emissiveIntensity: 2.4,
                    metalness: 0.35,
                    roughness: 0.18
                });

                //3. geometry construction
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

                group.add(root);
                this._buildings.push(root);
                placedB2.push(pos);
            }
        }

        //========== b3: akira style concrete megastructure with pipes ==========
        {
            const root = new T.Group();
            root.position.set(24, plazaHeight, 12);
            root.rotation.y = Math.PI / 14;

            //slightly brighter concrete to show details in dark scene
            const concreteColor = new T.Color(0x4a4c50);
            const darkConcrete = new T.Color(0x36383c);
            const rustColor = new T.Color(0x8a5a3d);
            const pipeColor = new T.Color(0x7a8088);
            const lampWarm = new T.Color(0xfff2c2);
            const slitCool = new T.Color(0xaad9ff);

            //core metal material with weak emissive
            const coreMat = new T.MeshStandardMaterial({
                color: 0x141824,
                metalness: 0.85,
                roughness: 0.45,
                emissive: 0x020309,
                emissiveIntensity: 0.25
            });

            const h3 = 32 * HEIGHT_SCALE;

            //core block
            const core = new T.Mesh(boxGeom, coreMat);
            core.scale.set(20, h3, 14);
            core.position.y = h3 / 2;
            enableShadows(core);
            root.add(core);

            //buttress wings on left and right
            const buttressMat = new T.MeshStandardMaterial({
                color: darkConcrete,
                metalness: 0.22,
                roughness: 0.9,
                emissive: 0x020203,
                emissiveIntensity: 0.12
            });
            for (let i = -1; i <= 1; i += 2) {
                const b = new T.Mesh(boxGeom, buttressMat);
                b.scale.set(5.0, h3 * 0.75, 7);
                b.position.set(i * 10.0, h3 * 0.35, 0);
                enableShadows(b);
                root.add(b);
            }

            //step terraces at the front
            const terraceMat = coreMat.clone();
            terraceMat.color = darkConcrete.clone().offsetHSL(0, -0.05, -0.03);
            const terraceGeom = new T.BoxGeometry(1, 1, 1);
            for (let i = 0; i < 4; i++) {
                const sX = 16 - i * 2.7;
                const sZ = 10 - i * 1.6;
                const y = 2.0 + i * 1.7;
                const block = new T.Mesh(terraceGeom, terraceMat);
                block.scale.set(sX, 0.7, sZ);
                block.position.set(-5 + i * 1.8, y, -3 + i * 0.8);
                enableShadows(block);
                root.add(block);
            }

            //large pipes on the front side
            const pipeMat = new T.MeshStandardMaterial({
                color: pipeColor,
                metalness: 0.55,
                roughness: 0.55,
                emissive: 0x101010,
                emissiveIntensity: 0.10
            });

            const py = h3 * 0.45;
            const pFrom = new T.Vector3(-8, py, 7.3);
            const pTo = new T.Vector3(8, py, 7.3);
            addPipe(root, { material: pipeMat, from: pFrom, to: pTo, radius: 0.55 });

            const vFrom = new T.Vector3(-8, py - 7, 7.3);
            const vTo = new T.Vector3(-8, py, 7.3);
            addPipe(root, { material: pipeMat, from: vFrom, to: vTo, radius: 0.5 });

            const elbow = new T.Mesh(torusGeom, pipeMat);
            elbow.scale.set(0.95, 0.95, 0.95);
            elbow.rotation.set(Math.PI / 2, 0, 0);
            elbow.position.set(-8, py, 7.3);
            root.add(elbow);

            //rust patches on front surface
            const rustMat = new T.MeshStandardMaterial({
                color: rustColor,
                metalness: 0.4,
                roughness: 0.96,
                emissive: 0x050100,
                emissiveIntensity: 0.08
            });
            const rustGeom = new T.BoxGeometry(1, 1, 1);
            for (let i = 0; i < 6; i++) {
                const p = new T.Mesh(rustGeom, rustMat);
                p.scale.set(2.8, 1.4, 0.25);
                p.position.set(-5 + i * 3.2, 3.6 + i * 1.3, 7.2);
                p.rotation.z = (Math.random() - 0.5) * 0.18;
                enableShadows(p);
                root.add(p);
            }

            //equipment boxes and vents at the front bottom
            const unitMat3 = new T.MeshStandardMaterial({
                color: 0x4a4f57,
                metalness: 0.45,
                roughness: 0.6,
                emissive: 0x000000
            });
            const unitGeom3 = new T.BoxGeometry(1, 1, 1);
            for (let i = 0; i < 7; i++) {
                const u = new T.Mesh(unitGeom3, unitMat3);
                u.scale.set(1.6, 1.0, 0.9);
                u.position.set(-8 + i * 3.0, 2.6, 7.1);
                enableShadows(u);
                root.add(u);
            }

            //industrial lamps at the front
            const lampMat3 = new T.MeshStandardMaterial({
                color: 0x000000,
                emissive: lampWarm,
                emissiveIntensity: 1.15,
                metalness: 0.25,
                roughness: 0.4
            });
            const lampGeom3 = new T.BoxGeometry(1, 1, 1);
            for (let i = -3; i <= 3; i++) {
                if (Math.random() < 0.18) continue;
                const lamp = new T.Mesh(lampGeom3, lampMat3);
                lamp.scale.set(0.5, 0.4, 0.12);
                lamp.position.set(i * 2.8, 5.4, 7.25);
                enableShadows(lamp);
                root.add(lamp);
            }

            //back lamps
            const backLampMat = new T.MeshStandardMaterial({
                color: 0x000000,
                emissive: lampWarm.clone(),
                emissiveIntensity: 1.35,
                metalness: 0.25,
                roughness: 0.4
            });
            for (let i = -2; i <= 2; i++) {
                const lamp = new T.Mesh(lampGeom3, backLampMat);
                lamp.scale.set(0.5, 0.4, 0.12);
                lamp.position.set(i * 3.4, 6.0, -7.25);
                enableShadows(lamp);
                root.add(lamp);
            }

            //top red beacons
            const beaconMat = new T.MeshStandardMaterial({
                color: 0x000000,
                emissive: 0xff5555,
                emissiveIntensity: 1.6,
                metalness: 0.3,
                roughness: 0.25
            });
            const beaconGeom = new T.CylinderGeometry(0.25, 0.25, 0.6, 14);
            const topY = h3 + 1.0;
            const beaconPositions = [
                new T.Vector3(-8.5, topY, 6.0),
                new T.Vector3(7.5, topY, 6.0),
                new T.Vector3(-8.5, topY, -6.0),
                new T.Vector3(7.5, topY, -6.0)
            ];
            beaconPositions.forEach((bp) => {
                const b = new T.Mesh(beaconGeom, beaconMat);
                b.position.copy(bp);
                enableShadows(b);
                root.add(b);
            });

            //front grooves
            const grooveMat3 = new T.MeshStandardMaterial({
                color: 0x2a2b2f,
                metalness: 0.2,
                roughness: 0.9,
                emissive: 0x000000
            });
            addVerticalGrooves(root, {
                material: grooveMat3,
                xCenter: 0,
                z: 7.0,
                yBottom: 2,
                yTop: h3 - 2,
                count: 6,
                spacing: 3.0,
                width: 0.22,
                depth: 0.15
            });

            //back grooves
            addVerticalGrooves(root, {
                material: grooveMat3,
                xCenter: 0,
                z: -7.0,
                yBottom: 2,
                yTop: h3 - 2,
                count: 6,
                spacing: 3.0,
                width: 0.22,
                depth: 0.15
            });

            //front greebles
            const greebleMat3 = new T.MeshStandardMaterial({
                color: 0x33363c,
                metalness: 0.4,
                roughness: 0.8,
                emissive: 0x000000
            });
            addGreeblesOnWall(root, {
                material: greebleMat3,
                xMin: -7.5,
                xMax: 7.5,
                yMin: 3.0,
                yMax: h3 - 3.0,
                z: 6.9,
                count: 26,
                minSize: new T.Vector2(0.6, 0.4),
                maxSize: new T.Vector2(1.8, 1.3),
                depth: 0.28
            });

            //back greebles
            addGreeblesOnWall(root, {
                material: greebleMat3,
                xMin: -7.5,
                xMax: 7.5,
                yMin: 3.0,
                yMax: h3 - 3.0,
                z: -6.9,
                count: 22,
                minSize: new T.Vector2(0.6, 0.4),
                maxSize: new T.Vector2(1.8, 1.3),
                depth: 0.28
            });

            //vertical cool light slits front and back
            const slitMat = new T.MeshStandardMaterial({
                color: 0x000000,
                emissive: slitCool,
                emissiveIntensity: 1.5,
                metalness: 0.2,
                roughness: 0.3
            });
            const slitGeom = new T.BoxGeometry(1, 1, 1);
            const slitHeight = h3 * 0.85;
            const slitY = 2.5 + slitHeight / 2;

            const frontSlits = [-4.0, 4.0];
            frontSlits.forEach((sx) => {
                const s = new T.Mesh(slitGeom, slitMat);
                s.scale.set(0.45, slitHeight, 0.15);
                s.position.set(sx, slitY, 7.15);
                enableShadows(s);
                root.add(s);
            });

            const backSlits = [-3.0, 3.0];
            backSlits.forEach((sx) => {
                const s = new T.Mesh(slitGeom, slitMat);
                s.scale.set(0.45, slitHeight * 0.9, 0.15);
                s.position.set(sx, slitY, -7.15);
                enableShadows(s);
                root.add(s);
            });

            group.add(root);
            this._buildings.push(root);
        }

        this._time = 0;
    }

    /**
     * compute a lookat view for a cluster of buildings
     * type: "B1" | "B2" | "B3"
     * returns [fromX, fromY, fromZ, atX, atY, atZ]
     */
    lookFromLookAtCluster(type) {
        /** @type {number[]} */
        let indices;
        switch (type) {
            case "B1":
                indices = [0, 1, 2, 3, 4];
                break;
            case "B2":
                indices = [5, 6, 7, 8, 9];
                break;
            case "B3":
                indices = [10];
                break;
            default:
                return [75, 45, 75, 0, 10, 0];
        }

        const center = new T.Vector3();
        const tmp = new T.Vector3();
        let count = 0;

        for (const idx of indices) {
            const b = this._buildings[idx];
            if (!b) continue;
            b.getWorldPosition(tmp);
            center.add(tmp);
            count++;
        }
        if (count === 0) {
            return [75, 45, 75, 0, 10, 0];
        }
        center.multiplyScalar(1 / count);

        const dist = 80;
        const from = new T.Vector3(
            center.x + dist,
            center.y + dist * 0.5,
            center.z + dist
        );

        return [from.x, from.y, from.z, center.x, center.y, center.z];
    }

    /** default camera view: overall bird eye over city and ring of towers */
    lookFromLookAt() {
        return [75, 45, 75, 0, 10, 0];
    }

    /** no animation by design */
    stepWorld(delta, timeOfDay) {
        //no-op
    }
}

//view helper objects for lookat ui entries

export class CyberTowerViewB1 extends GrObject {
    /**
     * @param {CyberTower} towerRef
     */
    constructor(towerRef) {
        const g = new T.Group();
        super("B1", g);
        this._tower = towerRef;
    }

    lookFromLookAt() {
        return this._tower.lookFromLookAtCluster("B1");
    }
}

export class CyberTowerViewB2 extends GrObject {
    /**
     * @param {CyberTower} towerRef
     */
    constructor(towerRef) {
        const g = new T.Group();
        super("B2", g);
        this._tower = towerRef;
    }

    lookFromLookAt() {
        return this._tower.lookFromLookAtCluster("B2");
    }
}

export class CyberTowerViewB3 extends GrObject {
    /**
     * @param {CyberTower} towerRef
     */
    constructor(towerRef) {
        const g = new T.Group();
        super("B3", g);
        this._tower = towerRef;
    }

    lookFromLookAt() {
        return this._tower.lookFromLookAtCluster("B3");
    }
}
