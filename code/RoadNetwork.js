/* jshint esversion: 6 */
// @ts-check

// deterministic cyber road network:
// 4 neon radial roads + 1 circular ring road
// upgraded with layered cyberpunk neon styling

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class RoadNetwork extends GrObject {
    /**
     * @param {object} [params]
     * @param {number} [params.innerRadius]   ring road radius
     * @param {number} [params.outerRadius]   start radius for radial roads
     * @param {number} [params.plazaHeight]   ground height
     * @param {number} [params.mainWidth]     width of the main radial roads
     */
    constructor(params = {}) {
        const group = new T.Group();

        const innerRadius = params.innerRadius ?? 45;
        const outerRadius = params.outerRadius || 42;
        const b2Radius = params.b2Radius ?? 55;         
        const b3Radius = params.b3Radius ?? 95;         
        const plazaHeight = params.plazaHeight ?? 0.2;
        const mainWidth   = params.mainWidth   || 2.0;
        const b2Width = params.b2Width ?? (mainWidth * 0.85);
        const thickness   = 0.05;
        const ringTube    = mainWidth * 0.5;
        const roadY       = plazaHeight + 0.01;

        // ===== Materials =====
        // Dark metallic base road (no glow)
        const baseRoadMat = new T.MeshStandardMaterial({
            color: 0x050308,
            metalness: 0.85,
            roughness: 0.35,
            emissive: 0x000000,
            emissiveIntensity: 0.0
        });

        // Central neon strip (main red-magenta glow)
        const centerNeonMat = new T.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.3,
            roughness: 0.8,
            emissive: 0xff3366,
            emissiveIntensity: 1.4,
            transparent: true,
            opacity: 0.96
        });

        // Edge neon strips (slightly purple)
        const edgeNeonMat = new T.MeshStandardMaterial({
            color: 0x05030b,
            metalness: 0.4,
            roughness: 0.7,
            emissive: 0xad3bff,
            emissiveIntensity: 1.1,
            transparent: true,
            opacity: 0.9
        });

        /** @type {T.Mesh[]} */
        const roads = [];          // structural parts (base, ring base)
        /** @type {T.Mesh[]} */
        const neonParts = [];      // all glowing neon strips

        /**
         * Build a layered straight road segment:
         * - dark metallic base plate
         * - glowing central neon strip
         * - two smaller neon edges
         *
         * @param {number} x1
         * @param {number} z1
         * @param {number} x2
         * @param {number} z2
         * @param {number} width
         */
        const addRoadSegment = (x1, z1, x2, z2, width) => {
            const dx = x2 - x1;
            const dz = z2 - z1;
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.001) return;

            const segGroup = new T.Group();

            // --- Base metal plate ---
            const baseGeom = new T.BoxGeometry(len, thickness * 0.6, width * 0.95);
            const baseMesh = new T.Mesh(baseGeom, baseRoadMat);
            baseMesh.receiveShadow = true;
            segGroup.add(baseMesh);
            roads.push(baseMesh);

            // --- Central neon strip ---
            const centerWidth = width * 0.32;
            const centerGeom = new T.BoxGeometry(len * 0.98, thickness * 0.22, centerWidth);
            const centerMesh = new T.Mesh(centerGeom, centerNeonMat);
            centerMesh.position.y = thickness * 0.4;
            segGroup.add(centerMesh);
            neonParts.push(centerMesh);

            // --- Side neon strips ---
            const edgeWidth = width * 0.12;
            const sideOffset = width * 0.34;

            const edgeGeom = new T.BoxGeometry(len * 0.98, thickness * 0.18, edgeWidth);

            const leftEdge = new T.Mesh(edgeGeom, edgeNeonMat);
            leftEdge.position.set(0, thickness * 0.35, -sideOffset);
            segGroup.add(leftEdge);
            neonParts.push(leftEdge);

            const rightEdge = new T.Mesh(edgeGeom, edgeNeonMat);
            rightEdge.position.set(0, thickness * 0.35, sideOffset);
            segGroup.add(rightEdge);
            neonParts.push(rightEdge);

            const mx = (x1 + x2) / 2;
            const mz = (z1 + z2) / 2;

            const angle = Math.atan2(dz, dx);

            segGroup.position.set(mx, roadY, mz);
            segGroup.rotation.y = -angle;

            group.add(segGroup);
        };

        // ===== Radial roads from middle ring outward =====

        const R_ring = innerRadius;   // middle ring: starting point for all straight lines
        const R2 = b2Radius;
        const R3 = b3Radius;

        const towerCount = 5;
        const step = (Math.PI * 2) / towerCount;
        const angleOffset = Math.PI / towerCount;
        const stagger = step / 2;

        // ---- 5 straight roads from ring → B3 ----
        for (let i = 0; i < towerCount; i++) {
            const a = angleOffset + i * step;

            const xStart = Math.cos(a) * R_ring;
            const zStart = Math.sin(a) * R_ring;

            const xEnd = Math.cos(a) * R3;
            const zEnd = Math.sin(a) * R3;

            addRoadSegment(
                xStart, zStart,
                xEnd,   zEnd,
                mainWidth
            );
        }

        // ---- 5 straight roads from ring → B2 (interleaved) ----
        for (let i = 0; i < towerCount; i++) {
            const a = angleOffset + stagger + i * step;

            const xStart = Math.cos(a) * R_ring;
            const zStart = Math.sin(a) * R_ring;

            const xEnd = Math.cos(a) * R2;
            const zEnd = Math.sin(a) * R2;

            addRoadSegment(
                xStart, zStart,
                xEnd,   zEnd,
                mainWidth * 0.85   // B2 secondary lanes slightly narrower (optional)
            );
        }

        // ===== Ring road (base + neon layer) =====
        // Base dark ring
        const ringBaseGeom = new T.TorusGeometry(innerRadius, ringTube * 0.55, 24, 96);
        const ringBaseMesh = new T.Mesh(ringBaseGeom, baseRoadMat);
        ringBaseMesh.rotation.x = Math.PI / 2;
        ringBaseMesh.position.y = roadY;
        ringBaseMesh.receiveShadow = true;
        group.add(ringBaseMesh);
        roads.push(ringBaseMesh);

        // Neon glowing ring above base
        const ringNeonGeom = new T.TorusGeometry(innerRadius, ringTube * 0.32, 32, 128);
        const ringNeonMesh = new T.Mesh(ringNeonGeom, centerNeonMat);
        ringNeonMesh.rotation.x = Math.PI / 2;
        ringNeonMesh.position.y = roadY + thickness * 0.7;
        ringNeonMesh.receiveShadow = true;
        group.add(ringNeonMesh);
        neonParts.push(ringNeonMesh);

        super("RoadNetwork", group);

        this.group = group;
        this._roads = roads;
        this._neonParts = neonParts;
        this._time = 0;
        this._baseEmissive = 1.0;
    }

    /**
     * animate neon glow: breathing + flicker + slight hue shift
     */
    stepWorld(delta, timeOfDay) {
        this._time += delta / 1000;
        const t = this._time;
        const base = this._baseEmissive;

        this._neonParts.forEach((mesh, idx) => {
            const mat = /** @type {T.MeshStandardMaterial} */ (mesh.material);
            const phase = idx * 0.7;

            // slow breathing
            const slowPulse = 0.55 + 0.45 * Math.sin(t * 2.2 + phase);

            // fast flicker
            const fastPulse = 0.15 * Math.sin(t * 13.0 + phase * 2.1);

            mat.emissiveIntensity = base * (slowPulse + fastPulse);

            // gentle hue drift (red ↔ magenta)
            const hue = 0.95 + 0.05 * Math.sin(t * 1.3 + phase);
            mat.emissive.setHSL(hue, 1.0, 0.55);
        });
    }

    /**
     * suggested camera view
     */
    lookFromLookAt() {
        return [0, 40, 55, 0, 0, 0];
    }
}
