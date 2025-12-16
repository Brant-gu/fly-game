/* jshint esversion: 6 */
// @ts-check

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class NeonPlaza extends GrObject {
    constructor() {
        const group = new T.Group();
        group.position.y = 0.2;

        //base floor
        const baseFloorGeom = new T.CircleGeometry(100, 64);
        const baseFloorMat = new T.MeshStandardMaterial({
            color: 0x345675,      
            metalness: 0.0,
            roughness: 0.95,
            emissive: 0x000000,
            emissiveIntensity: 0.0,
            side: T.DoubleSide
        });

        const baseFloor = new T.Mesh(baseFloorGeom, baseFloorMat);
        baseFloor.rotation.x = -Math.PI / 2;
        group.add(baseFloor);

        //neon shader overlay disc
        const neonGroundMat = new T.ShaderMaterial({
            uniforms: {
                uTime:       { value: 0.0 },
                uInnerColor: { value: new T.Color(0x00f6ff) },
                uOuterColor: { value: new T.Color(0x2b2724) },
                uGlowColor: { value: new T.Color(0xff2266) },
                uBrightness: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3  uInnerColor;
                uniform vec3  uOuterColor;
                uniform float uBrightness;
                varying vec2 vUv;

                void main() {
                    vec2 p = vUv * 2.0 - 1.0;
                    float r = length(p);
                    float t = smoothstep(1.0, 0.0, r);
                    vec3 color = mix(uOuterColor, uInnerColor, t);
                    color *= uBrightness * 0.15;
                    float alpha = smoothstep(1.05, 0.85, r) * 0.6;
                    gl_FragColor = vec4(color, alpha);
                }
            `,

            transparent: true,
            depthWrite: false,
            blending: T.NormalBlending
        });

        const neonGeom = new T.CircleGeometry(80, 128);
        const neonDisc = new T.Mesh(neonGeom, neonGroundMat);
        neonDisc.rotation.x = -Math.PI / 2;
        neonDisc.position.y = 0.50;
        group.add(neonDisc);

        //central tower ring
        const towerGeom = new T.CylinderGeometry(0.3, 0.3, 4, 16);
        const numTowers = 12;
        const radius = 7;
        for (let i = 0; i < numTowers; i++) {
            const angle = (i / numTowers) * Math.PI * 2;
            const mat = new T.MeshStandardMaterial({
                color: 0x111111,
                metalness: 1.0,
                roughness: 0.2,
                emissive: 0x00ffff,
                emissiveIntensity: 0.4
            });
            const tower = new T.Mesh(towerGeom, mat);
            tower.position.set(
                Math.cos(angle) * radius,
                2,
                Math.sin(angle) * radius
            );
            group.add(tower);
        }

        //floating ring
        const ringGeom = new T.TorusGeometry(5, 0.1, 16, 64);
        const ringMat = new T.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.8,
            metalness: 1.0,
            roughness: 0.1
        });
        const ring = new T.Mesh(ringGeom, ringMat);
        ring.position.y = 5;
        group.add(ring);

        super("NeonPlaza", group);

        this.group = group;
        this._ring = ring;
        this._towers = group.children.filter(
            (c) => c !== baseFloor && c !== neonDisc && c !== ring
        );
        /** @type {T.ShaderMaterial} */
        this._floorMat = neonGroundMat;
        this._time = 0;
    }

    /**
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        const dt = delta / 1000;
        this._time += dt;

        if (this._floorMat) {
            this._floorMat.uniforms.uTime.value = this._time;
        }

        //slow rotation of the whole plaza
        this.group.rotation.y += delta * 0.0003;

        //floating ring vertical motion
        this._ring.position.y = 5 + Math.sin(this._time * 0.3) * 0.5;

        //tower emissive flicker
        this._towers.forEach((tw, idx) => {
            const m = /** @type {T.MeshStandardMaterial} */ (tw.material);
            m.emissiveIntensity =
                0.3 + 0.15 * Math.sin(this._time * 1.2 + idx);
        });
    }
}
