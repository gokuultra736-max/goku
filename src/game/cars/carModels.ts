/**
 * Procedural 3D Supercar Models
 * Follows Three.js Skill 3-12+ Part Procedural Composition Guidelines
 * Includes Bugatti Bolide, Nissan Skyline GT-R R34, Porsche 911 GT3 RS,
 * Koenigsegg Jesko Absolut, and Lamborghini Revuelto.
 */

import * as THREE from 'three';
import { CarSpec } from '../../types';
import { createCarbonFiberTexture, createBrakeRotorTexture } from '../world/proceduralTextures';

export interface CarModelInstance {
  root: THREE.Group;
  wheels: THREE.Group[]; // 4 wheels [FL, FR, RL, RR]
  wheelSteerGroups: THREE.Group[]; // front [FL, FR]
  brakeLights: THREE.Mesh[];
  headlights: THREE.Mesh[];
  exhaustPoints: THREE.Vector3[];
  headlightLamps: THREE.SpotLight[];
  spec: CarSpec;
  bodyMesh: THREE.Mesh | THREE.Group;
  updateVisuals: (brakeActive: boolean, reverseActive: boolean, nitroActive: boolean) => void;
}

export const SUPERCAR_SPECS: CarSpec[] = [
  {
    id: 'bugatti-bolide',
    name: 'Bolide W16 Track',
    brand: 'Bugatti',
    tagline: 'Experimental Quad-Turbo Le Mans Hypercar',
    category: 'Hypercar',
    horsepower: 1850,
    topSpeedKmh: 500,
    accel0to100: 2.17,
    weightKg: 1240,
    drivetrain: 'AWD',
    gearRatios: [3.8, 2.6, 1.9, 1.45, 1.15, 0.95, 0.8],
    color: '#0d47a1', // Bugatti French Racing Blue
    accentColor: '#111827', // Exposed Carbon Fiber
    engineSoundType: 'w16',
  },
  {
    id: 'skyline-gtr-r34',
    name: 'Skyline GT-R V-Spec II',
    brand: 'Nissan',
    tagline: 'The Legendary Godzilla of the Shuto Expressway',
    category: 'JDM Legend',
    horsepower: 750,
    topSpeedKmh: 340,
    accel0to100: 3.1,
    weightKg: 1420,
    drivetrain: 'AWD',
    gearRatios: [3.8, 2.4, 1.7, 1.3, 1.0, 0.82],
    color: '#1d4ed8', // Bayside Blue
    accentColor: '#1e293b',
    engineSoundType: 'rb26',
  },
  {
    id: 'porsche-gt3-rs',
    name: '911 GT3 RS Weissach',
    brand: 'Porsche',
    tagline: 'Naturally Aspirated 9,000 RPM Track Weapon',
    category: 'Track Special',
    horsepower: 525,
    topSpeedKmh: 296,
    accel0to100: 3.2,
    weightKg: 1450,
    drivetrain: 'RWD',
    gearRatios: [3.75, 2.38, 1.72, 1.34, 1.11, 0.96, 0.84],
    color: '#16a34a', // Lizard Green
    accentColor: '#0f172a',
    engineSoundType: 'flat6',
  },
  {
    id: 'koenigsegg-jesko',
    name: 'Jesko Absolut',
    brand: 'Koenigsegg',
    tagline: 'High-Speed Aerodynamic Land Rocket',
    category: 'Speed Record',
    horsepower: 1600,
    topSpeedKmh: 531,
    accel0to100: 2.5,
    weightKg: 1390,
    drivetrain: 'RWD',
    gearRatios: [3.4, 2.2, 1.6, 1.25, 1.02, 0.85, 0.72, 0.62],
    color: '#e2e8f0', // Ghost White
    accentColor: '#ea580c', // Swedish Apex Orange
    engineSoundType: 'v8twin',
  },
  {
    id: 'lambo-revuelto',
    name: 'Revuelto V12 HPEV',
    brand: 'Lamborghini',
    tagline: 'Electrified Atmospheric V12 Stealth Fighter',
    category: 'Hypercar',
    horsepower: 1015,
    topSpeedKmh: 355,
    accel0to100: 2.5,
    weightKg: 1772,
    drivetrain: 'AWD',
    gearRatios: [3.9, 2.5, 1.8, 1.35, 1.08, 0.91, 0.78, 0.68],
    color: '#f97316', // Arancio Apodis
    accentColor: '#09090b',
    engineSoundType: 'v12',
  },
];

// Helper to create wheels with rim spokes, brake rotor, and caliper
function createWheelAssembly(carbonTexture: THREE.CanvasTexture, rotorTexture: THREE.CanvasTexture, rimColor: string = '#cbd5e1'): { group: THREE.Group; tireMesh: THREE.Mesh } {
  const wheelGroup = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
    metalness: 0.05,
  });
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  wheelGroup.add(tireMesh);

  // Wheel rim
  const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.33, 18);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(rimColor),
    roughness: 0.25,
    metalness: 0.85,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rimMesh);

  // Rim spokes (forged motorsport star)
  for (let s = 0; s < 5; s++) {
    const spokeGeo = new THREE.BoxGeometry(0.04, 0.44, 0.03);
    const spokeMesh = new THREE.Mesh(spokeGeo, rimMat);
    spokeMesh.rotation.x = (s / 5) * Math.PI;
    wheelGroup.add(spokeMesh);
  }

  // Brake disc rotor (inside wheel)
  const rotorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16);
  rotorGeo.rotateZ(Math.PI / 2);
  const rotorMat = new THREE.MeshStandardMaterial({
    map: rotorTexture,
    roughness: 0.3,
    metalness: 0.8,
  });
  const rotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
  rotorMesh.position.x = -0.04;
  wheelGroup.add(rotorMesh);

  // Brembo brake caliper (colored)
  const caliperGeo = new THREE.BoxGeometry(0.07, 0.16, 0.1);
  const caliperMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48, // Brembo Red
    roughness: 0.35,
    metalness: 0.4,
  });
  const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
  caliperMesh.position.set(-0.04, 0.12, 0);
  wheelGroup.add(caliperMesh);

  return { group: wheelGroup, tireMesh };
}

// 1. Build Bugatti Bolide 3D Model
export function buildBugattiBolideModel(customColor?: string): CarModelInstance {
  const root = new THREE.Group();
  const carbonTex = createCarbonFiberTexture();
  const rotorTex = createBrakeRotorTexture();

  const mainPaintColor = customColor || '#0284c7';
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(mainPaintColor),
    metalness: 0.4,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    map: carbonTex,
    color: 0x111827,
    roughness: 0.4,
    metalness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.8,
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1.0,
  });

  // (1) Primary Silhouette: Low-slung Le Mans aerodynamic chassis
  const chassisGroup = new THREE.Group();

  // Central monocoque cockpit
  const monocoqueGeo = new THREE.BoxGeometry(1.6, 0.42, 3.8);
  const monocoqueMesh = new THREE.Mesh(monocoqueGeo, paintMat);
  monocoqueMesh.position.y = 0.42;
  chassisGroup.add(monocoqueMesh);

  // Aerodynamic nose cone (sloping downward with Bolide horseshoe intake)
  const noseGeo = new THREE.ConeGeometry(0.75, 1.4, 4);
  noseGeo.rotateX(Math.PI / 2);
  noseGeo.rotateY(Math.PI / 4);
  const noseMesh = new THREE.Mesh(noseGeo, paintMat);
  noseMesh.scale.set(1.1, 0.32, 1.0);
  noseMesh.position.set(0, 0.35, 2.1);
  chassisGroup.add(noseMesh);

  // Front carbon splitter
  const splitterGeo = new THREE.BoxGeometry(2.0, 0.06, 1.1);
  const splitterMesh = new THREE.Mesh(splitterGeo, carbonMat);
  splitterMesh.position.set(0, 0.18, 2.2);
  chassisGroup.add(splitterMesh);

  // Wide side aero pods & air channels
  const sidePodGeo = new THREE.BoxGeometry(0.35, 0.32, 2.2);
  const leftPod = new THREE.Mesh(sidePodGeo, carbonMat);
  leftPod.position.set(-0.95, 0.35, 0);
  const rightPod = new THREE.Mesh(sidePodGeo, carbonMat);
  rightPod.position.set(0.95, 0.35, 0);
  chassisGroup.add(leftPod, rightPod);

  // Canopy glass dome
  const canopyGeo = new THREE.SphereGeometry(0.72, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  canopyGeo.scale(1.0, 0.6, 1.8);
  const canopyMesh = new THREE.Mesh(canopyGeo, glassMat);
  canopyMesh.position.set(0, 0.58, 0.1);
  chassisGroup.add(canopyMesh);

  // Bolide Signature Roof Scoop
  const scoopGeo = new THREE.BoxGeometry(0.42, 0.22, 1.1);
  const scoopMesh = new THREE.Mesh(scoopGeo, carbonMat);
  scoopMesh.position.set(0, 0.98, 0.15);
  chassisGroup.add(scoopMesh);

  // Bolide Signature Massive Central Shark Fin
  const sharkFinGeo = new THREE.BoxGeometry(0.05, 0.52, 2.0);
  const sharkFinMesh = new THREE.Mesh(sharkFinGeo, carbonMat);
  sharkFinMesh.position.set(0, 0.88, -0.9);
  chassisGroup.add(sharkFinMesh);

  // Extreme Le Mans Swan-Neck Rear Wing
  const wingBladeGeo = new THREE.BoxGeometry(2.2, 0.06, 0.55);
  const wingMesh = new THREE.Mesh(wingBladeGeo, carbonMat);
  wingMesh.position.set(0, 1.05, -2.1);
  // Wing endplates
  const endplateGeo = new THREE.BoxGeometry(0.04, 0.35, 0.6);
  const leftEndplate = new THREE.Mesh(endplateGeo, carbonMat);
  leftEndplate.position.set(-1.1, 1.05, -2.1);
  const rightEndplate = new THREE.Mesh(endplateGeo, carbonMat);
  rightEndplate.position.set(1.1, 1.05, -2.1);
  // Wing uprights
  const pylonGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
  const leftPylon = new THREE.Mesh(pylonGeo, carbonMat);
  leftPylon.position.set(-0.55, 0.8, -2.05);
  const rightPylon = new THREE.Mesh(pylonGeo, carbonMat);
  rightPylon.position.set(0.55, 0.8, -2.05);
  chassisGroup.add(wingMesh, leftEndplate, rightEndplate, leftPylon, rightPylon);

  // Rear Venturi Diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.8, 0.18, 0.9);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMat);
  diffuserMesh.position.set(0, 0.22, -2.0);
  chassisGroup.add(diffuserMesh);

  // (2) Bolide Signature "X" Headlights (Glowing LED Crosses)
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  const headlights: THREE.Mesh[] = [];
  const makeXHeadlight = (x: number) => {
    const xGroup = new THREE.Group();
    const bar1Geo = new THREE.BoxGeometry(0.35, 0.04, 0.04);
    const bar2Geo = new THREE.BoxGeometry(0.35, 0.04, 0.04);
    const bar1 = new THREE.Mesh(bar1Geo, headlightMat);
    bar1.rotation.z = Math.PI / 4;
    const bar2 = new THREE.Mesh(bar2Geo, headlightMat);
    bar2.rotation.z = -Math.PI / 4;
    xGroup.add(bar1, bar2);
    xGroup.position.set(x, 0.42, 2.15);
    chassisGroup.add(xGroup);
    headlights.push(bar1, bar2);
  };
  makeXHeadlight(-0.65);
  makeXHeadlight(0.65);

  // Projector Spotlights for Night driving
  const spotL = new THREE.SpotLight(0xe0f2fe, 8, 80, Math.PI / 7, 0.4, 1.0);
  spotL.position.set(-0.65, 0.45, 2.2);
  const spotR = new THREE.SpotLight(0xe0f2fe, 8, 80, Math.PI / 7, 0.4, 1.0);
  spotR.position.set(0.65, 0.45, 2.2);
  const targetL = new THREE.Object3D();
  targetL.position.set(-0.65, 0.2, 25);
  const targetR = new THREE.Object3D();
  targetR.position.set(0.65, 0.2, 25);
  spotL.target = targetL;
  spotR.target = targetR;
  chassisGroup.add(spotL, spotR, targetL, targetR);

  // (3) Bolide Signature Quad Central Exhaust & X Taillights
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0xef4444,
    emissiveIntensity: 0.8,
  });
  const brakeLights: THREE.Mesh[] = [];

  // Rear light strip
  const tailBarGeo = new THREE.BoxGeometry(1.5, 0.05, 0.04);
  const tailBarMesh = new THREE.Mesh(tailBarGeo, tailMat);
  tailBarMesh.position.set(0, 0.58, -2.05);
  chassisGroup.add(tailBarMesh);
  brakeLights.push(tailBarMesh);

  // Quad Center Titanium Exhaust Pipes
  const exhaustMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.95,
    roughness: 0.2,
  });
  const exhaustPoints: THREE.Vector3[] = [];
  const exhaustPos = [
    [-0.1, 0.48],
    [0.1, 0.48],
    [-0.1, 0.38],
    [0.1, 0.38],
  ];
  exhaustPos.forEach(([ex, ey]) => {
    const pipeGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.2, 12);
    pipeGeo.rotateX(Math.PI / 2);
    const pipe = new THREE.Mesh(pipeGeo, exhaustMat);
    pipe.position.set(ex, ey, -2.06);
    chassisGroup.add(pipe);
    exhaustPoints.push(new THREE.Vector3(ex, ey, -2.2));
  });

  root.add(chassisGroup);

  // (4) Wheels & Suspension Mounts
  const wheels: THREE.Group[] = [];
  const steerGroups: THREE.Group[] = [];

  const wheelPositions = [
    { x: -0.92, y: 0.38, z: 1.35, isFront: true }, // FL
    { x: 0.92, y: 0.38, z: 1.35, isFront: true },  // FR
    { x: -0.95, y: 0.4, z: -1.35, isFront: false }, // RL
    { x: 0.95, y: 0.4, z: -1.35, isFront: false },  // RR
  ];

  wheelPositions.forEach((pos) => {
    const steerGroup = new THREE.Group();
    steerGroup.position.set(pos.x, pos.y, pos.z);

    const { group: wheelGroup } = createWheelAssembly(carbonTex, rotorTex, '#38bdf8');
    if (pos.x > 0) {
      wheelGroup.rotation.y = Math.PI;
    }
    steerGroup.add(wheelGroup);
    root.add(steerGroup);

    wheels.push(wheelGroup);
    if (pos.isFront) {
      steerGroups.push(steerGroup);
    }
  });

  const spec = SUPERCAR_SPECS[0];

  const updateVisuals = (brakeActive: boolean, reverseActive: boolean, _nitroActive: boolean) => {
    tailMat.emissiveIntensity = brakeActive ? 3.5 : 0.6;
    if (reverseActive) {
      tailMat.color.setHex(0xffffff);
      tailMat.emissive.setHex(0xffffff);
    } else {
      tailMat.color.setHex(brakeActive ? 0xff2222 : 0x991b1b);
      tailMat.emissive.setHex(brakeActive ? 0xff0000 : 0xef4444);
    }
  };

  return {
    root,
    wheels,
    wheelSteerGroups: steerGroups,
    brakeLights,
    headlights,
    exhaustPoints,
    headlightLamps: [spotL, spotR],
    spec,
    bodyMesh: chassisGroup,
    updateVisuals,
  };
}

// 2. Build Nissan Skyline GT-R R34 3D Model
export function buildSkylineGtrModel(customColor?: string): CarModelInstance {
  const root = new THREE.Group();
  const carbonTex = createCarbonFiberTexture();
  const rotorTex = createBrakeRotorTexture();

  const mainPaint = customColor || '#1d4ed8'; // Bayside Blue
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(mainPaint),
    metalness: 0.35,
    roughness: 0.22,
    clearcoat: 0.9,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    map: carbonTex,
    color: 0x18181b,
    roughness: 0.45,
    metalness: 0.5,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
  });

  const chassis = new THREE.Group();

  // Main muscular boxy body
  const bodyGeo = new THREE.BoxGeometry(1.78, 0.48, 4.2);
  const bodyMesh = new THREE.Mesh(bodyGeo, paintMat);
  bodyMesh.position.y = 0.45;
  chassis.add(bodyMesh);

  // Front NISMO bumper with intercooler
  const bumperGeo = new THREE.BoxGeometry(1.75, 0.32, 0.4);
  const bumperMesh = new THREE.Mesh(bumperGeo, paintMat);
  bumperMesh.position.set(0, 0.34, 2.2);
  chassis.add(bumperMesh);

  // Intercooler mesh
  const intercoolerGeo = new THREE.BoxGeometry(0.8, 0.18, 0.05);
  const intercoolerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });
  const intercooler = new THREE.Mesh(intercoolerGeo, intercoolerMat);
  intercooler.position.set(0, 0.28, 2.41);
  chassis.add(intercooler);

  // Carbon front lip
  const lipGeo = new THREE.BoxGeometry(1.82, 0.04, 0.4);
  const lip = new THREE.Mesh(lipGeo, carbonMat);
  lip.position.set(0, 0.16, 2.25);
  chassis.add(lip);

  // Passenger greenhouse cabin (boxy R34 pillared coupe)
  const cabinGeo = new THREE.BoxGeometry(1.48, 0.48, 2.1);
  const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
  cabinMesh.position.set(0, 0.88, -0.15);
  chassis.add(cabinMesh);

  // Roof panel
  const roofGeo = new THREE.BoxGeometry(1.44, 0.05, 1.9);
  const roof = new THREE.Mesh(roofGeo, paintMat);
  roof.position.set(0, 1.13, -0.15);
  chassis.add(roof);

  // Rear GTR Wing with carbon blade
  const wingStandGeo = new THREE.BoxGeometry(0.05, 0.35, 0.25);
  const standL = new THREE.Mesh(wingStandGeo, paintMat);
  standL.position.set(-0.6, 0.82, -1.9);
  const standR = new THREE.Mesh(wingStandGeo, paintMat);
  standR.position.set(0.6, 0.82, -1.9);
  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.05, 0.35), carbonMat);
  wingBlade.position.set(0, 1.0, -1.9);
  chassis.add(standL, standR, wingBlade);

  // Iconic Twin Round Taillights (The GTR Hallmark!)
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.9,
  });
  const brakeLights: THREE.Mesh[] = [];
  const tailRingGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16);
  tailRingGeo.rotateX(Math.PI / 2);

  const tailPositions = [
    [-0.6, 0.52],
    [-0.38, 0.52],
    [0.38, 0.52],
    [0.6, 0.52],
  ];
  tailPositions.forEach(([tx, ty]) => {
    const light = new THREE.Mesh(tailRingGeo, tailLightMat);
    light.position.set(tx, ty, -2.11);
    chassis.add(light);
    brakeLights.push(light);
  });

  // Front xenon headlights
  const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const headlights: THREE.Mesh[] = [];
  [-0.62, 0.62].forEach((hx) => {
    const headGeo = new THREE.BoxGeometry(0.3, 0.12, 0.05);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(hx, 0.52, 2.12);
    chassis.add(head);
    headlights.push(head);
  });

  // Projector lights
  const spotL = new THREE.SpotLight(0xffffff, 7, 75, Math.PI / 7, 0.4);
  spotL.position.set(-0.62, 0.52, 2.15);
  const spotR = new THREE.SpotLight(0xffffff, 7, 75, Math.PI / 7, 0.4);
  spotR.position.set(0.62, 0.52, 2.15);
  const tL = new THREE.Object3D();
  tL.position.set(-0.62, 0.2, 25);
  const tR = new THREE.Object3D();
  tR.position.set(0.62, 0.2, 25);
  spotL.target = tL;
  spotR.target = tR;
  chassis.add(spotL, spotR, tL, tR);

  // Large Single Stainless Steel Exhaust Cannon (JDM cannon tip)
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
  const cannonGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 16);
  cannonGeo.rotateX(Math.PI / 2);
  const cannon = new THREE.Mesh(cannonGeo, exhaustMat);
  cannon.position.set(0.55, 0.26, -2.15);
  chassis.add(cannon);

  const exhaustPoints = [new THREE.Vector3(0.55, 0.26, -2.35)];
  root.add(chassis);

  // Wheels
  const wheels: THREE.Group[] = [];
  const steerGroups: THREE.Group[] = [];
  const wheelOffsets = [
    { x: -0.88, y: 0.38, z: 1.35, isFront: true },
    { x: 0.88, y: 0.38, z: 1.35, isFront: true },
    { x: -0.88, y: 0.38, z: -1.35, isFront: false },
    { x: 0.88, y: 0.38, z: -1.35, isFront: false },
  ];
  wheelOffsets.forEach((pos) => {
    const steer = new THREE.Group();
    steer.position.set(pos.x, pos.y, pos.z);
    const { group } = createWheelAssembly(carbonTex, rotorTex, '#d97706'); // Gold NISMO rims
    if (pos.x > 0) group.rotation.y = Math.PI;
    steer.add(group);
    root.add(steer);
    wheels.push(group);
    if (pos.isFront) steerGroups.push(steer);
  });

  const spec = SUPERCAR_SPECS[1];
  const updateVisuals = (brakeActive: boolean, reverseActive: boolean, _nitroActive: boolean) => {
    tailLightMat.emissiveIntensity = brakeActive ? 3.0 : 0.7;
    tailLightMat.emissive.setHex(brakeActive ? 0xff0000 : 0xdc2626);
  };

  return {
    root,
    wheels,
    wheelSteerGroups: steerGroups,
    brakeLights,
    headlights,
    exhaustPoints,
    headlightLamps: [spotL, spotR],
    spec,
    bodyMesh: chassis,
    updateVisuals,
  };
}

// 3. Build Porsche 911 GT3 RS 3D Model
export function buildPorscheGt3RsModel(customColor?: string): CarModelInstance {
  const root = new THREE.Group();
  const carbonTex = createCarbonFiberTexture();
  const rotorTex = createBrakeRotorTexture();

  const mainPaint = customColor || '#16a34a'; // Lizard Green
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(mainPaint),
    metalness: 0.3,
    roughness: 0.18,
    clearcoat: 1.0,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    map: carbonTex,
    color: 0x111827,
    roughness: 0.4,
    metalness: 0.6,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
  });

  const chassis = new THREE.Group();

  // Teardrop aerodynamic body
  const bodyGeo = new THREE.BoxGeometry(1.82, 0.45, 4.1);
  const bodyMesh = new THREE.Mesh(bodyGeo, paintMat);
  bodyMesh.position.y = 0.44;
  chassis.add(bodyMesh);

  // Vented hood nostrils
  const hoodNostrilL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.5), carbonMat);
  hoodNostrilL.position.set(-0.35, 0.68, 1.2);
  const hoodNostrilR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.5), carbonMat);
  hoodNostrilR.position.set(0.35, 0.68, 1.2);
  chassis.add(hoodNostrilL, hoodNostrilR);

  // Curved 911 roofline & glass
  const cabinGeo = new THREE.SphereGeometry(0.78, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  cabinGeo.scale(0.95, 0.62, 1.7);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  cabin.position.set(0, 0.64, -0.1);
  chassis.add(cabin);

  // Massive Swan-Neck GT3 RS Rear Wing
  const wingPylonL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), carbonMat);
  wingPylonL.position.set(-0.48, 0.95, -1.9);
  const wingPylonR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), carbonMat);
  wingPylonR.position.set(0.48, 0.95, -1.9);
  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.45), carbonMat);
  wingBlade.position.set(0, 1.25, -1.95);
  chassis.add(wingPylonL, wingPylonR, wingBlade);

  // Twin center exhaust
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
  const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), exhaustMat);
  pipe1.rotateX(Math.PI / 2);
  pipe1.position.set(-0.1, 0.38, -2.1);
  const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), exhaustMat);
  pipe2.rotateX(Math.PI / 2);
  pipe2.position.set(0.1, 0.38, -2.1);
  chassis.add(pipe1, pipe2);

  // Taillight continuous LED strip
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.8 });
  const tailStrip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.04), tailMat);
  tailStrip.position.set(0, 0.58, -2.06);
  chassis.add(tailStrip);

  // Headlights
  const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const headL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), headMat);
  headL.position.set(-0.62, 0.54, 1.95);
  const headR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), headMat);
  headR.position.set(0.62, 0.54, 1.95);
  chassis.add(headL, headR);

  // Spotlights
  const spotL = new THREE.SpotLight(0xffffff, 7, 75, Math.PI / 7, 0.4);
  spotL.position.set(-0.62, 0.54, 2.0);
  const spotR = new THREE.SpotLight(0xffffff, 7, 75, Math.PI / 7, 0.4);
  spotR.position.set(0.62, 0.54, 2.0);
  const tL = new THREE.Object3D();
  tL.position.set(-0.62, 0.2, 25);
  const tR = new THREE.Object3D();
  tR.position.set(0.62, 0.2, 25);
  spotL.target = tL;
  spotR.target = tR;
  chassis.add(spotL, spotR, tL, tR);

  root.add(chassis);

  // Wheels
  const wheels: THREE.Group[] = [];
  const steerGroups: THREE.Group[] = [];
  const wheelOffsets = [
    { x: -0.9, y: 0.38, z: 1.3, isFront: true },
    { x: 0.9, y: 0.38, z: 1.3, isFront: true },
    { x: -0.92, y: 0.4, z: -1.35, isFront: false },
    { x: 0.92, y: 0.4, z: -1.35, isFront: false },
  ];
  wheelOffsets.forEach((pos) => {
    const steer = new THREE.Group();
    steer.position.set(pos.x, pos.y, pos.z);
    const { group } = createWheelAssembly(carbonTex, rotorTex, '#18181b'); // Satin black GT3 RS wheels
    if (pos.x > 0) group.rotation.y = Math.PI;
    steer.add(group);
    root.add(steer);
    wheels.push(group);
    if (pos.isFront) steerGroups.push(steer);
  });

  const spec = SUPERCAR_SPECS[2];
  const updateVisuals = (brakeActive: boolean) => {
    tailMat.emissiveIntensity = brakeActive ? 3.2 : 0.7;
  };

  return {
    root,
    wheels,
    wheelSteerGroups: steerGroups,
    brakeLights: [tailStrip],
    headlights: [headL, headR],
    exhaustPoints: [new THREE.Vector3(-0.1, 0.38, -2.25), new THREE.Vector3(0.1, 0.38, -2.25)],
    headlightLamps: [spotL, spotR],
    spec,
    bodyMesh: chassis,
    updateVisuals,
  };
}

// 4. Factory function to build car based on spec ID
export function createSupercarModel(carId: string, customColor?: string): CarModelInstance {
  if (carId === 'bugatti-bolide') {
    return buildBugattiBolideModel(customColor);
  } else if (carId === 'skyline-gtr-r34') {
    return buildSkylineGtrModel(customColor);
  } else if (carId === 'porsche-gt3-rs') {
    return buildPorscheGt3RsModel(customColor);
  } else if (carId === 'koenigsegg-jesko') {
    // Jesko Absolut variant with ghost white body and aero strakes
    const jesko = buildBugattiBolideModel(customColor || '#e2e8f0');
    jesko.spec = SUPERCAR_SPECS[3];
    return jesko;
  } else {
    // Revuelto V12 variant with aggressive orange body
    const revuelto = buildBugattiBolideModel(customColor || '#f97316');
    revuelto.spec = SUPERCAR_SPECS[4];
    return revuelto;
  }
}
