/* jshint esversion: 6 */
// @ts-check

import * as T from "./libs/CS559-Three/build/three.module.js";

// ===== Keep the three elements you specified =====
import { PlayerAircraft } from "./code/PlayerAircraft.js";
import { GameController } from "./code/GameController.js";
import { UIManager } from "./code/UIManager.js";

import { AudioManager } from "./code/AudioManager.js";

// ===== City scene =====
import { StarDome } from "./code/NeonStarDome.js";
import { NeonPlaza } from "./code/NeonPlaza.js";
import { EnergyCoreTower } from "./code/EnergyCoreTower.js";
import { EnergyRings } from "./code/EnergyRings.js";
import { NeonCircuits } from "./code/NeonCircuits.js";
import { CyberTowerB1 } from "./code/CyberTowerB1.js";
import { CyberTowerB2 } from "./code/CyberTowerB2.js";
import { CyberTowerB3 } from "./code/CyberTowerB3.js";
import { RailPodTrack } from "./code/RailPodTrack.js";
import { HoloTrees } from "./code/HoloTrees.js";
import { NeonBillboard } from "./code/NeonBillboard.js";
import { RoadNetwork } from "./code/RoadNetwork.js";
import { CyberDrones } from "./code/CyberDrones.js";
import { ImportedModel } from "./code/ImportedModel.js";
import { CyberRobotWalker } from "./code/CyberRobotWalker.js";
import { CyberHovercraft } from "./code/CyberHovercraft.js";
import { NeonDrone } from "./code/NeonDrone.js";

const Mode = Object.freeze({
  PROTOTYPE: "prototype",
  FULL: "full",
});

/**
 * Decide mode:
 * 1) prototype.html / full.html sets window.__GAME_MODE__
 * 2) fallback: URL ?mode=prototype|full
 */
function getGameMode() {
  const fromWindow = (typeof window !== "undefined" && window.__GAME_MODE__) ? String(window.__GAME_MODE__) : "";
  if (fromWindow === Mode.FULL) return Mode.FULL;
  if (fromWindow === Mode.PROTOTYPE) return Mode.PROTOTYPE;

  const p = new URLSearchParams(window.location.search);
  const m = p.get("mode");
  return (m === Mode.FULL) ? Mode.FULL : Mode.PROTOTYPE;
}

const GAME_MODE = getGameMode();

// Renderer
const renderer = new T.WebGLRenderer({ antialias: true });
const worldContainer = /** @type {HTMLElement} */ (document.getElementById("world-container"));
renderer.setSize(worldContainer.clientWidth, worldContainer.clientHeight);
worldContainer.appendChild(renderer.domElement);

// Scene & Camera
const scene = new T.Scene();

const camera = new T.PerspectiveCamera(
  85,
  worldContainer.clientWidth / worldContainer.clientHeight,
  0.1,
  2000
);
camera.position.set(0, 5, 12);

// Lights
scene.add(new T.AmbientLight(0xffffff, 0.22));
scene.add(new T.HemisphereLight(0xffffff, 0x080820, 0.85));
const moon = new T.DirectionalLight(0xffffff, 1.2);
moon.position.set(120, 80, 40);
scene.add(moon);

function addGrObjectToScene(grObj) {
  if (grObj && grObj.objects && grObj.objects[0]) {
    scene.add(grObj.objects[0]);
  } else if (grObj && grObj.isObject3D) {
    scene.add(grObj);
  } else {
    console.warn("Unknown object type, cannot add to scene:", grObj);
  }
}

// Keep a list of "steppable" objects so prototype/full can differ cleanly
/** @type {any[]} */
const steppables = [];

// ===== Build World: FULL vs PROTOTYPE =====

// Common: core gameplay objects
const rings = new EnergyRings({ height: 6, radius: 3.2 });
addGrObjectToScene(rings);
steppables.push(rings);

const circuits = new NeonCircuits();
addGrObjectToScene(circuits);
steppables.push(circuits);

const plaza = new NeonPlaza();
addGrObjectToScene(plaza);
steppables.push(plaza);

const drone = new NeonDrone();
addGrObjectToScene(drone);
steppables.push(drone);

const core = new EnergyCoreTower();
addGrObjectToScene(core);
steppables.push(core);

const rail = new RailPodTrack({ radius: 90, podSpeed: 0.6, y: 0.35 });
addGrObjectToScene(rail);
steppables.push(rail);

const trees = new HoloTrees({ count: 20, innerRadius: 20, outerRadius: 85, y: 0.2 });
addGrObjectToScene(trees);
steppables.push(trees);

const towersB1 = new CyberTowerB1({ plazaHeight: 0.2 });
addGrObjectToScene(towersB1);
steppables.push(towersB1);

const towersB2 = new CyberTowerB2({ plazaHeight: 0.2 });
addGrObjectToScene(towersB2);
steppables.push(towersB2);

const towersB3 = new CyberTowerB3({ plazaHeight: 0.2 });
addGrObjectToScene(towersB3);
steppables.push(towersB3);

const roads = new RoadNetwork({
  innerRadius: 35,
  b2Radius: 55,
  b3Radius: 75,
  plazaHeight: 0.2,
  mainWidth: 2.0
});
addGrObjectToScene(roads);
steppables.push(roads);

const drones = new CyberDrones({
  count: 12,
  areaRadius: 90,
  minY: 24,
  maxY: 32,
  baseSpeed: 7,
  turnInterval: 3,
  maxTurn: Math.PI / 3
});
addGrObjectToScene(drones);
steppables.push(drones);

const craft = new CyberHovercraft({
  x: 0,
  y: 30,
  z: 0,
  scale: 2.5,
  speed: 25
});
addGrObjectToScene(craft);
steppables.push(craft);

const bot1 = new CyberRobotWalker({
  x: 10,
  z: 8,
  plazaHeight: 0.2,
  areaRadius: 85,
  speed: 7.5,
  turnInterval: 2.2,
  maxTurn: Math.PI / 2,
  scale: 3
});
addGrObjectToScene(bot1);
steppables.push(bot1);

const extraBots = [];
for (let i = 0; i < 6; i++) {
  const b = new CyberRobotWalker({
    x: (Math.random() * 40 - 20),
    z: (Math.random() * 40 - 20),
    plazaHeight: 0.2,
    areaRadius: 85,
    speed: 4.5 + Math.random() * 4,
    turnInterval: 1.6 + Math.random() * 2.2,
    maxTurn: Math.PI * (0.35 + Math.random() * 0.35),
    scale: 0.9 + Math.random() * 0.7
  });
  extraBots.push(b);
  addGrObjectToScene(b);
  steppables.push(b);
}

// Player + UI + Audio + Controller
const player = new PlayerAircraft();
addGrObjectToScene(player);

const ui = new UIManager();
const audio = new AudioManager();

const controller = new GameController({
  scene: scene,
  camera: camera,
  player: player,
  ui: ui,
  audio: audio,
  baseSpeed: 30,
  regionX: 60,
  regionZ: 60,
  yMin: 15,
  yMax: 40
});

if (typeof controller.registerCityObstacles === "function") {
  controller.registerCityObstacles(towersB1, 8);
  controller.registerCityObstacles(towersB2, 8);
  controller.registerCityObstacles(towersB3, 8);
}

// Mode-specific objects
let starDome = null;
let model1 = null;
let billboard = null;

if (GAME_MODE === Mode.FULL) {
  // FULL: allow models & textures
  model1 = new ImportedModel({
    url: "./models/TransferOnly1.glb",
    x: 0,
    y: 85,
    z: 0,
    scale: 100
  });
  addGrObjectToScene(model1);
  steppables.push(model1);

  starDome = new StarDome({
    radius: 500,
    count: 500,
    meteorCount: 8,
    brightness: 1.05,
    blackLevel: 0.12
  });
  addGrObjectToScene(starDome);
  steppables.push(starDome);

  billboard = new NeonBillboard({
    x: -12,
    z: -6,
    width: 20,
    height: 6
  });
  addGrObjectToScene(billboard);
  steppables.push(billboard);
} else {
  // PROTOTYPE: basic geometry only (no model/texture loaders from this entry)
  // Optional: show a simple "sky shell" using pure color material (no textures)
  const skyGeom = new T.SphereGeometry(600, 24, 16);
  const skyMat = new T.MeshBasicMaterial({ color: 0x050510, side: T.BackSide });
  const sky = new T.Mesh(skyGeom, skyMat);
  scene.add(sky);
}

ui.bindDifficultyButtons((level) => {
  controller.setDifficulty(level);
  ui.hideMenu();
  if (GAME_MODE === Mode.FULL) {
    audio.startMusic();
  }
});

ui.bindReplay(() => {
  window.location.reload();
});

// Animation loop
let last = performance.now();

function stepIfPossible(obj, deltaMs) {
  if (obj && typeof obj.stepWorld === "function") {
    obj.stepWorld(deltaMs);
  }
}

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = (now - last) / 1000;
  last = now;

  const speedRatio = controller.currentSpeed / controller.baseSpeed;

  if (typeof player.update === "function") {
    player.update(delta, speedRatio);
  }

  controller.update(delta);

  const deltaMs = delta * 1000;
  for (const obj of steppables) stepIfPossible(obj, deltaMs);

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  const width = worldContainer.clientWidth;
  const height = worldContainer.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
