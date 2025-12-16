/* jshint esversion: 6 */
// @ts-check

// GrObject wrapper for a GLB model

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GLTFLoader } from "../libs/CS559-Three/examples/jsm/loaders/GLTFLoader.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class ImportedModel extends GrObject {
    /**
     * @param {{
     *   url?: string,   // relative path to the GLB
     *   x?: number,
     *   y?: number,
     *   z?: number,
     *   playAll?: boolean,   
     *   scale?: number
     * }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();
        super("ImportedModel", group);

        const url   = params.url   || "../models/TransferOnly1.glb"; 
        const px    = params.x     ?? 0;
        const py    = params.y     ?? 0;
        const pz    = params.z     ?? 0;
        const scale = params.scale ?? 1;

        group.position.set(px, py, pz);

        /** @type {T.AnimationMixer | null} */
        this.mixer = null;
        /** @type {T.AnimationAction[]} */
        this.actions = [];

        const loader = new GLTFLoader();

        // async load GLB
        loader.load(
            url,
            (gltf) => {
                const model = gltf.scene;

                // optional: set scale & shadow
                model.scale.set(scale, scale, scale);

                model.traverse((obj) => {
                    if (obj.isMesh) {
                        obj.castShadow = true;
                        obj.receiveShadow = true;
                    }
                });

                group.add(model);
                const clips = gltf.animations || [];
                if (clips.length > 0) {
                this.mixer = new T.AnimationMixer(model);

                const clipName = params.clipName;
                if (clipName) {
                    const clip = T.AnimationClip.findByName(clips, clipName);
                    if (clip) {
                    const action = this.mixer.clipAction(clip);
                    action.play();
                    this.actions.push(action);
                    } else {
                    console.warn("Clip name not found:", clipName, "Available:", clips.map(c => c.name));
                    }
                } else {
                    const playAll = params.playAll ?? false;
                    if (playAll) {
                    clips.forEach((clip) => {
                        const action = this.mixer.clipAction(clip);
                        action.play();
                        this.actions.push(action);
                    });
                    } else {
                    const action = this.mixer.clipAction(clips[0]);
                    action.play();
                    this.actions.push(action);
                    }
                }
                } else {
                console.warn("No animations in GLB:", url);
                }
            },
            undefined,
            (err) => {
                console.error("Failed to load GLB:", url, err);
            }
        );

        // store for future use if you want to animate it
        this._group = group;
    }

    /**
     * optional animation hook
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        if (this.mixer) {
            this.mixer.update(delta / 3000); // delta is in ms
        }
    }
}
