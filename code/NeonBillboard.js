/* jshint esversion: 6 */
// @ts-check

// neon billboard

import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";

export class NeonBillboard extends GrObject {
    /**
     * @param {{
     *   x?: number,                // fixed x if provided; otherwise random within the ring band
     *   z?: number,                // fixed z if provided; otherwise random within the ring band
     *   y?: number,                // fixed y if provided; otherwise random within building-height range
     *   width?: number,            // screen width
     *   height?: number,           // screen height
     *   maxBuildingHeight?: number,// tallest building height in the scene (determines random height range)
     *   radiusMin?: number,        // inner radius for random spread
     *   radiusMax?: number,        // outer radius for random spread
     *   centerX?: number,          // city center X (used for orientation)
     *   centerZ?: number           // city center Z (used for orientation)
     * }} [params]
     */
    constructor(params = {}) {
        const group = new T.Group();

        // ===== Position and range parameters =====
        const maxBuildingHeight = params.maxBuildingHeight ?? 30; // height of one building
        const radiusMin = params.radiusMin ?? 25;
        const radiusMax = params.radiusMax ?? 60;
        const centerX   = params.centerX   ?? 0;
        const centerZ   = params.centerZ   ?? 0;

        // --- random/fixed XZ ---
        let posX, posZ;
        if (params.x !== undefined && params.z !== undefined) {
            posX = params.x;
            posZ = params.z;
        } else {
            const r = radiusMin + Math.random() * (radiusMax - radiusMin);
            const angle = Math.random() * Math.PI * 2;
            posX = centerX + Math.cos(angle) * r;
            posZ = centerZ + Math.sin(angle) * r;
        }

        // --- random/fixed Y ---
        let posY;
        if (params.y !== undefined) {
            posY = params.y;
        } else {
            const minY = maxBuildingHeight * 1.05;  // slightly higher than the tallest building
            const maxY = maxBuildingHeight * 2.0;   // no more than twice the building height
            posY = minY + Math.random() * (maxY - minY);
        }

        // set root node position
        group.position.set(posX, posY, posZ);

        // orient billboard roughly toward city center
        const angleToCenter = Math.atan2(centerX - posX, centerZ - posZ);
        group.rotation.y = angleToCenter;

        const width  = params.width  ?? 10;
        const height = params.height ?? 4;

        // ========== support frame ==========
        const frameGeom = new T.BoxGeometry(width + 0.3, height + 0.3, 0.3);
        const frameMat = new T.MeshStandardMaterial({
            color: 0x050505,
            metalness: 1.0,
            roughness: 0.2
        });
        const frame = new T.Mesh(frameGeom, frameMat);
        frame.position.y = height / 2 + 1.2;
        group.add(frame);

        const poleGeom = new T.BoxGeometry(0.5, 2.4, 0.5);
        const pole = new T.Mesh(poleGeom, frameMat);
        pole.position.y = 1.2;
        group.add(pole);

        // ========== front and back screen base ==========
        const screenGeom = new T.PlaneGeometry(width, height);
        const screenMat = new T.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x111133,
            emissiveIntensity: 0.6,
            metalness: 0.2,
            roughness: 0.4,
            side: T.FrontSide
        });
        const screen = new T.Mesh(screenGeom, screenMat);
        screen.position.y = frame.position.y;
        screen.position.z = 0.16; // slightly in front of frame
        group.add(screen);

        const backScreenMat = new T.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x080820,
            emissiveIntensity: 0.4,
            side: T.BackSide
        });
        const backScreen = new T.Mesh(screenGeom, backScreenMat);
        backScreen.position.y = frame.position.y;
        backScreen.position.z = -0.16;
        group.add(backScreen);

        // ========== canvas text texture ==========
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");

        const texture = new T.CanvasTexture(canvas);
        texture.minFilter = T.LinearFilter;
        texture.magFilter = T.LinearFilter;
        texture.wrapS = T.ClampToEdgeWrapping;
        texture.wrapT = T.ClampToEdgeWrapping;

        const textMat = new T.MeshBasicMaterial({
            map: texture,
            transparent: true
        });

        // front text plane
        const textPlane = new T.Mesh(screenGeom, textMat);
        textPlane.position.copy(screen.position);
        textPlane.position.z += 0.01;
        group.add(textPlane);

        // back text plane showing the same content
        const backTextPlane = new T.Mesh(screenGeom, textMat);
        backTextPlane.position.y = backScreen.position.y;
        backTextPlane.position.z = backScreen.position.z - 0.01;
        backTextPlane.rotation.y = Math.PI; // flip so front faces backward
        group.add(backTextPlane);

        super("NeonBillboard", group);

        this.group = group;
        this._canvas = canvas;
        this._ctx = ctx;
        this._texture = texture;
        this._textPlane = textPlane;
        this._backTextPlane = backTextPlane;
        this._screenMat = screenMat;

        this._time = 0;

        // messages cycled on the billboard
        this._messages = [
            "CYBER CORE DISTRICT",
            "NEON CITY // 2099",
            "ACCESS: AUTHORIZED PERSONNEL ONLY",
            "POWER LEVEL 98.7%"
        ];
        this._currentIndex = 0;
        this._lastSwitchTime = 0; // seconds
    }

    /**
     * draw current text and scanlines on canvas
     * @param {number} tSec
     */
    _redrawText(tSec) {
        const ctx = this._ctx;
        const canvas = this._canvas;
        const msg = this._messages[this._currentIndex];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // background gradient
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#020412");
        grad.addColorStop(1, "#061a33");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // scanline overlay
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = "#00ffff";
        const lineHeight = 4;
        for (let y = 0; y < canvas.height; y += lineHeight * 2) {
            ctx.fillRect(0, y, canvas.width, lineHeight);
        }
        ctx.globalAlpha = 1.0;

        // main title text
        ctx.font = "bold 42px 'Consolas', 'Courier New', monospace";
        ctx.fillStyle = "#00ffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 18;
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);

        // small status text in bottom-right corner
        ctx.shadowBlur = 0;
        ctx.font = "18px 'Consolas', 'Courier New', monospace";
        ctx.fillStyle = "#ff66ff";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        const tStr = `SYS TIME ${tSec.toFixed(1)}s`;
        ctx.fillText(tStr, canvas.width - 14, canvas.height - 10);

        this._texture.needsUpdate = true;
    }

    /**
     * animation: text cycling, occasional flicker refresh and screen breathing
     * @param {number} delta
     * @param {number} timeOfDay
     */
    stepWorld(delta, timeOfDay) {
        this._time += delta / 1000;
        const t = this._time;

        // switch message every 4 seconds
        if (t - this._lastSwitchTime > 4.0) {
            this._currentIndex = (this._currentIndex + 1) % this._messages.length;
            this._lastSwitchTime = t;
            this._redrawText(t);
        } else if (Math.random() < 0.02) {
            // occasional forced redraw for subtle flicker
            this._redrawText(t);
        }

        // screen emissive breathing
        const base = 0.6;
        const pulse = 0.3 * Math.sin(t * 3.0) + 0.2 * Math.sin(t * 7.0);
        this._screenMat.emissiveIntensity = base + pulse;

        // slight rotation to keep billboard feeling alive
        this.group.rotation.y += delta * 0.0003;
    }

    lookFromLookAt() {
        const p = this.group.position;
        return [p.x + 10, p.y + 6, p.z + 10, p.x, p.y + 3, p.z];
    }
}
