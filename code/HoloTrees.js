/* jshint esversion: 6 */
// @ts-check

// holographic neon trees
// ring of detailed cyber trees with emissive breathing and subtle holo motion

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class HoloTrees extends GrObject {
    /**
     * @param {{
     *   count?: number,       // number of trees
     *   innerRadius?: number, // inner radius of tree ring
     *   outerRadius?: number, // outer radius of tree ring
     *   y?: number            // base y close to plaza surface
     * }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();

        const count       = params.count       || 20;
        const innerRadius = params.innerRadius || 10;
        const outerRadius = params.outerRadius || 18;
        const baseY       = params.y           || 0.2;   // close to plaza surface

        /** @type {T.Group[]} */
        const trees = [];

        for (let i = 0; i < count; i++) {
            //random position
            const r = innerRadius + Math.random() * (outerRadius - innerRadius);
            const angle = Math.random() * Math.PI * 2;

            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;

            //random size
            const trunkHeight = 1.4 + Math.random() * 0.6;
            const crownSize   = 0.9 + Math.random() * 0.5;

            //base hue: blue-green / cyan offset
            const hueBase = 0.45 + (Math.random() - 0.5) * 0.08;
            const trunkColor = new T.Color().setHSL(hueBase, 0.4, 0.4);
            const leafColor  = new T.Color().setHSL(hueBase + 0.1, 1.0, 0.6);
            const baseColor  = new T.Color().setHSL(hueBase + 0.05, 0.9, 0.4);

            //ground "energy pad"
            const padRadius = 0.35 + Math.random() * 0.2;
            const padGeom = new T.CylinderGeometry(padRadius, padRadius, 0.06, 24);
            const padMat = new T.MeshStandardMaterial({
                color: baseColor.clone().offsetHSL(0, 0, -0.15),
                metalness: 0.9,
                roughness: 0.15,
                emissive: baseColor,
                emissiveIntensity: 1.3
            });
            const pad = new T.Mesh(padGeom, padMat);
            pad.position.y = baseY + 0.03;

            // inner glowing energy ring
            const innerPadGeom = new T.CylinderGeometry(padRadius * 0.55, padRadius * 0.55, 0.02, 32);
            const innerPadMat = new T.MeshStandardMaterial({
                color: baseColor,
                metalness: 0.5,
                roughness: 0.1,
                emissive: baseColor,
                emissiveIntensity: 1.8,
                transparent: true,
                opacity: 0.8
            });
            const innerPad = new T.Mesh(innerPadGeom, innerPadMat);
            innerPad.position.y = baseY + 0.05;

            //tree trunk: core + outer holo grid

            // core trunk (more solid)
            const trunkCoreGeom = new T.CylinderGeometry(0.06, 0.08, trunkHeight, 16);
            const trunkCoreMat = new T.MeshStandardMaterial({
                color: trunkColor,
                metalness: 0.7,
                roughness: 0.2,
                emissive: trunkColor.clone().multiplyScalar(0.6),
                emissiveIntensity: 0.7,
                transparent: true,
                opacity: 0.9
            });
            const trunkCore = new T.Mesh(trunkCoreGeom, trunkCoreMat);
            trunkCore.position.y = baseY + trunkHeight / 2;

            // outer holo grid (wireframe)
            const trunkOuterGeom = new T.CylinderGeometry(0.1, 0.1, trunkHeight, 20, 1, true);
            const trunkOuterMat = new T.MeshStandardMaterial({
                color: trunkColor.clone().offsetHSL(0.03, 0.2, 0.1),
                metalness: 0.9,
                roughness: 0.05,
                emissive: trunkColor,
                emissiveIntensity: 0.9,
                transparent: true,
                opacity: 0.4,
                wireframe: true
            });
            const trunkOuter = new T.Mesh(trunkOuterGeom, trunkOuterMat);
            trunkOuter.position.y = baseY + trunkHeight / 2;

            // middle nodes "rings" - like data nodes
            const nodeCount = 3 + Math.floor(Math.random() * 3);
            const nodes = [];
            for (let n = 0; n < nodeCount; n++) {
                const yRatio = (n + 1) / (nodeCount + 1);
                const nodeRadius = 0.12;
                const nodeGeom = new T.TorusGeometry(nodeRadius, 0.02, 10, 36);
                const nodeMat = new T.MeshStandardMaterial({
                    color: leafColor.clone().offsetHSL(0, 0, 0.1),
                    metalness: 0.8,
                    roughness: 0.1,
                    emissive: leafColor,
                    emissiveIntensity: 1.2,
                    transparent: true,
                    opacity: 0.7
                });
                const node = new T.Mesh(nodeGeom, nodeMat);
                node.rotation.x = Math.PI / 2;
                node.position.y = baseY + yRatio * trunkHeight;
                nodes.push(node);
            }

            //tree crown

            //main crown
            const crownGeom = new T.IcosahedronGeometry(crownSize, 2);
            const crownMat = new T.MeshStandardMaterial({
                color: leafColor,
                emissive: leafColor,
                emissiveIntensity: 1.4,
                metalness: 0.3,
                roughness: 0.05,
                transparent: true,
                opacity: 0.75
            });
            const crown = new T.Mesh(crownGeom, crownMat);
            crown.position.y = baseY + trunkHeight + crownSize * 0.3;

            //inner glowing core
            const coreGeom = new T.SphereGeometry(crownSize * 0.35, 16, 16);
            const coreMat = new T.MeshStandardMaterial({
                color: leafColor.clone().offsetHSL(0, 0.1, 0.1),
                metalness: 0.1,
                roughness: 0.0,
                emissive: leafColor.clone().offsetHSL(0.02, 0.1, 0.2),
                emissiveIntensity: 2.2,
                transparent: true,
                opacity: 0.85
            });
            const core = new T.Mesh(coreGeom, coreMat);
            core.position.y = crown.position.y;

            //additional holo rings
            const rings = [];
            const ringCount = 2 + Math.floor(Math.random() * 2);
            for (let ri = 0; ri < ringCount; ri++) {
                const ringRadius = crownSize * (0.7 + ri * 0.25);
                const ringGeom = new T.TorusGeometry(ringRadius, 0.03, 12, 64);
                const ringMat = new T.MeshStandardMaterial({
                    color: leafColor.clone().offsetHSL(0.05 * (ri - 0.5), 0, 0),
                    metalness: 0.7,
                    roughness: 0.1,
                    emissive: leafColor.clone().offsetHSL(0.05 * (ri - 0.5), 0, 0.15),
                    emissiveIntensity: 1.6,
                    transparent: true,
                    opacity: 0.8
                });
                const ring = new T.Mesh(ringGeom, ringMat);
                ring.position.y = crown.position.y + (ri - 0.5) * (crownSize * 0.3);
                ring.rotation.x = Math.PI / 2 * (ri % 2 === 0 ? 1 : 0.4);
                rings.push(ring);
            }

            //light orbs orbiting the tree crown
            const orbs = [];
            const orbCount = 3 + Math.floor(Math.random() * 3);
            for (let oi = 0; oi < orbCount; oi++) {
                const orbGeom = new T.SphereGeometry(0.07, 10, 10);
                const orbMat = new T.MeshStandardMaterial({
                    color: leafColor.clone().offsetHSL(0.08, 0, 0.1),
                    metalness: 0.9,
                    roughness: 0.05,
                    emissive: leafColor.clone().offsetHSL(0.08, 0.2, 0.2),
                    emissiveIntensity: 1.8,
                    transparent: true,
                    opacity: 0.9
                });
                const orb = new T.Mesh(orbGeom, orbMat);

                const radius = crownSize * (0.6 + Math.random() * 0.5);
                const heightOffset = (Math.random() - 0.3) * crownSize * 0.6;
                const baseAngle = Math.random() * Math.PI * 2;
                const speed = 0.6 + Math.random() * 0.7;

                orb.userData.radius = radius;
                orb.userData.heightOffset = heightOffset;
                orb.userData.baseAngle = baseAngle;
                orb.userData.speed = speed;

                // initial position
                const a0 = baseAngle;
                orb.position.set(
                    Math.cos(a0) * radius,
                    baseY + trunkHeight + crownSize * 0.3 + heightOffset,
                    Math.sin(a0) * radius
                );

                orbs.push(orb);
            }

            //assemble
            const tree = new T.Group();
            tree.add(pad);
            tree.add(innerPad);
            tree.add(trunkCore);
            tree.add(trunkOuter);
            nodes.forEach((n) => tree.add(n));
            tree.add(crown);
            tree.add(core);
            rings.forEach((r) => tree.add(r));
            orbs.forEach((o) => tree.add(o));

            tree.position.set(x, 0, z);

            // random phase, dynamic parts references
            tree.userData.phase      = Math.random() * Math.PI * 2;
            tree.userData.crown      = crown;
            tree.userData.core       = core;
            tree.userData.rings      = rings;
            tree.userData.orbs       = orbs;
            tree.userData.baseY      = baseY;
            tree.userData.trunkHeight = trunkHeight;
            tree.userData.crownSize  = crownSize;

            group.add(tree);
            trees.push(tree);
        }

        super("HoloTrees", group);

        this.group = group;
        this._trees = trees;
        this._time = 0;
    }

    /**
     * crown brightness / opacity breathing + slight scaling,
     * holo rings slowly rotating, small orbs orbiting the crown
     * @param {number} delta      - ms since last frame
     * @param {number} timeOfDay  - not used here
     */
    stepWorld(delta, timeOfDay) {
        this._time += delta / 1000;
        const t = this._time;

        this._trees.forEach((tree) => {
            const phase = tree.userData.phase || 0;
            /** @type {T.Mesh} */
            const crown = tree.userData.crown;
            /** @type {T.Mesh} */
            const core = tree.userData.core;
            /** @type {T.Mesh[]} */
            const rings = tree.userData.rings || [];
            /** @type {T.Mesh[]} */
            const orbs = tree.userData.orbs || [];

            const baseY = tree.userData.baseY || 0.2;
            const trunkHeight = tree.userData.trunkHeight || 1.6;
            const crownSize = tree.userData.crownSize || 1.0;

            if (crown) {
                const mat = /** @type {T.MeshStandardMaterial} */ (crown.material);
                const pulse = 1.1 + 0.5 * Math.sin(t * 3.0 + phase);

                // emissive & opacity breathing
                mat.emissiveIntensity = pulse;
                mat.opacity = 0.6 + 0.2 * Math.sin(t * 2.0 + phase);

                // slight scaling, make crown "breathe"
                const scale = 1.0 + 0.05 * Math.sin(t * 2.5 + phase);
                crown.scale.set(scale, scale, scale);
            }

            if (core) {
                const coreMat = /** @type {T.MeshStandardMaterial} */ (core.material);
                coreMat.emissiveIntensity = 1.8 + 0.8 * Math.sin(t * 4.0 + phase * 1.3);
            }

            // holo rings slowly rotating
            rings.forEach((ring, idx) => {
                ring.rotation.z = t * (0.4 + idx * 0.2) + phase * 0.5;
                ring.rotation.y = t * 0.2 * (idx % 2 === 0 ? 1 : -1);
            });

            // small orbs orbiting the crown
            orbs.forEach((orb) => {
                const radius = orb.userData.radius;
                const heightOffset = orb.userData.heightOffset;
                const baseAngle = orb.userData.baseAngle;
                const speed = orb.userData.speed;

                const angle = baseAngle + t * speed;

                orb.position.set(
                    Math.cos(angle) * radius,
                    baseY + trunkHeight + crownSize * 0.3 + heightOffset +
                        0.05 * Math.sin(t * 3.0 + baseAngle), // slight vertical bobbing
                    Math.sin(angle) * radius
                );
            });
        });
    }

    /**
     * view ring of trees from above
     */
    lookFromLookAt() {
        return [0, 15, 15, 0, 0, 0];
    }
}
