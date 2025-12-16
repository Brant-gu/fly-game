/* jshint esversion: 6 */
// @ts-check


import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

const skyVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const skyFragmentShader = `
    uniform sampler2D map;
    uniform float blackLevel;
    uniform float brightness;

    varying vec2 vUv;

    void main() {
        vec4 tex = texture2D(map, vUv);
        vec3 c = tex.rgb * brightness;
        c = (c - blackLevel) / (1.0 - blackLevel);
        c = max(c, 0.0);      
        gl_FragColor = vec4(c, tex.a);
    }
`;

export class StarDome extends GrObject {
    /**
     * @param {{
     *   radius?: number,
     *   meteorCount?: number,
     *   brightness?: number,
     *   blackLevel?: number
     * }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();

        const radius      = params.radius      || 400;   
        const meteorCount = params.meteorCount || 8;     
        const brightness  = params.brightness  ?? 1.05;   
        const blackLevel  = params.blackLevel  ?? 0.12;  
        const skyGeom = new T.SphereGeometry(radius, 64, 32);

        const texLoader = new T.TextureLoader();
        const skyTex = texLoader.load("./star_sky.jpg");
        
        const skyMat = new T.ShaderMaterial({
            uniforms: {
                map:        { value: skyTex },
                blackLevel: { value: blackLevel },
                brightness: { value: brightness }
            },
            vertexShader: skyVertexShader,
            fragmentShader: skyFragmentShader,
            side: T.BackSide
        });

        const skyMesh = new T.Mesh(skyGeom, skyMat);
        skyMesh.renderOrder = -1;
        skyMat.depthWrite = false;

        group.add(skyMesh);


        const meteorsGroup = new T.Group();
        group.add(meteorsGroup);
        const meteorGeom = new T.ConeGeometry(0.5, 5, 6); 
        const meteorMat = new T.MeshBasicMaterial({
            color: 0xffeeaa
        });

        /** @type {T.Mesh[]} */
        const meteors = [];
        for (let i = 0; i < meteorCount; i++) {
            const m = new T.Mesh(meteorGeom, meteorMat.clone());
            meteorsGroup.add(m);
            meteors.push(m);
        }

        super("StarDome", group);

        this._sky = skyMesh;
        this._meteors = meteors;
        this._radius = radius;
        this._time = 0;

        this._meteorShellFactor = 0.95;

        for (const m of this._meteors) {
            this._resetMeteor(m);
        }
    }
    /**
     * @param {T.Mesh} meteor 
     */
    _resetMeteor(meteor) {
        const shellR = this._radius * this._meteorShellFactor;

        let pos = new T.Vector3();

        while (true) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);

            const x = shellR * Math.sin(phi) * Math.cos(theta);
            const y = shellR * Math.sin(phi) * Math.sin(theta);
            const z = shellR * Math.cos(phi);

            pos.set(x, y, z);

            if (pos.y > 40) break;
        }

        const radial = pos.clone().normalize();

        let randomDir = new T.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        const dot = randomDir.dot(radial);
        let tangent = randomDir.sub(radial.clone().multiplyScalar(dot));

        if (tangent.lengthSq() < 1e-4) {
            tangent = new T.Vector3(-radial.y, radial.x, 0);
        }
        tangent.normalize();

        let dir = tangent
            .clone()
            .multiplyScalar(0.97)
            .add(radial.clone().multiplyScalar(-0.25))
            .normalize();

        const speed = 60 + Math.random() * 40; // 60~100

        meteor.position.copy(pos);

        meteor.userData.vx = dir.x * speed;
        meteor.userData.vy = dir.y * speed;
        meteor.userData.vz = dir.z * speed;

        meteor.userData.life = 0;
        meteor.userData.maxLife = 1.5 + Math.random() * 1.5; // 1.5~3

        const up = new T.Vector3(0, 1, 0); 
        meteor.quaternion.setFromUnitVectors(up, dir.clone().normalize());

        const s = 0.4 + Math.random() * 0.5;
        meteor.scale.set(s, s, s);
    }

    /**
     * @param {number} delta  
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        const dt = delta / 1000; 
        this._time += dt;

        this._sky.rotation.y = this._time * 0.01;

        const shellR = this._radius * this._meteorShellFactor;

        if (this._meteors) {
            for (const m of this._meteors) {
                const data = m.userData;

                m.position.x += data.vx * dt;
                m.position.y += data.vy * dt;
                m.position.z += data.vz * dt;

                const pos = m.position;
                if (pos.lengthSq() > 0.0001) {
                    pos.setLength(shellR);
                }

                data.life += dt;
                if (data.life > data.maxLife) {
                    this._resetMeteor(m);
                }
            }
        }
    }

    lookFromLookAt() {
        return [30, 20, 30, 0, 0, 0];
    }
}



