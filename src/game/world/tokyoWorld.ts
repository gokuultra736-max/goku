/**
 * Open-World Tokyo City Map (Forza Horizon 6 / Shuto Expressway inspired)
 * Zero external 3D models or textures - 100% procedurally assembled
 * Includes Elevated Shuto Expressway Loop, Shibuya Boulevard, Tokyo Tower,
 * Daikoku PA drift meet plaza, Speed Traps, and Underground Tunnel.
 */

import * as THREE from 'three';
import {
  createAsphaltTexture,
  createWetRoadRoughnessTexture,
  createHighwayGantrySign,
  createTokyoNeonBillboard,
} from './proceduralTextures';

export interface SpeedTrap {
  id: string;
  name: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  width: number;
  triggerDistance: number;
}

export interface Checkpoint {
  id: number;
  position: THREE.Vector3;
  radius: number;
}

export interface TokyoWorldResult {
  root: THREE.Group;
  roadMeshes: THREE.Mesh[];
  collisionBoxes: THREE.Box3[];
  speedTraps: SpeedTrap[];
  raceCheckpoints: Checkpoint[];
  aiWaypoints: THREE.Vector3[];
  neonBillboards: THREE.Mesh[];
  streetLights: THREE.PointLight[];
  tunnelLights: THREE.PointLight[];
  tokyoTowerLights: THREE.PointLight[];
  updateTimeVisuals: (isNight: boolean, wetness: number) => void;
}

export function buildTokyoWorld(): TokyoWorldResult {
  const root = new THREE.Group();
  const roadMeshes: THREE.Mesh[] = [];
  const collisionBoxes: THREE.Box3[] = [];
  const speedTraps: SpeedTrap[] = [];
  const neonBillboards: THREE.Mesh[] = [];
  const streetLights: THREE.PointLight[] = [];
  const tunnelLights: THREE.PointLight[] = [];
  const tokyoTowerLights: THREE.PointLight[] = [];

  const asphaltTex = createAsphaltTexture();
  const wetRoughnessTex = createWetRoadRoughnessTexture();

  // Road asphalt PBR material with wetness parameters
  const roadMaterial = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughnessMap: wetRoughnessTex,
    roughness: 0.7,
    metalness: 0.15,
  });

  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.85,
    metalness: 0.1,
  });

  const barrierMaterial = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.4,
    metalness: 0.8,
  });

  // Building facade materials
  const glassTowerMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.15,
    metalness: 0.85,
  });

  const darkConcreteMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    metalness: 0.1,
  });

  // ==========================================
  // 1. ELEVATED SHUTO EXPRESSWAY LOOP (C1)
  // ==========================================
  const viaductGroup = new THREE.Group();

  // Main straight viaduct section: Z from -500 to 500, Y = 6.0
  const viaductLength = 1000;
  const viaductWidth = 24;
  const viaductGeo = new THREE.BoxGeometry(viaductWidth, 1.2, viaductLength);
  const viaductMesh = new THREE.Mesh(viaductGeo, roadMaterial);
  viaductMesh.position.set(0, 6.0, 0);
  viaductMesh.receiveShadow = true;
  viaductGroup.add(viaductMesh);
  roadMeshes.push(viaductMesh);

  // Highway Guardrails (Left and Right)
  const railGeo = new THREE.BoxGeometry(0.5, 1.1, viaductLength);
  const leftRail = new THREE.Mesh(railGeo, barrierMaterial);
  leftRail.position.set(-viaductWidth / 2 + 0.3, 6.0 + 1.0, 0);
  const rightRail = new THREE.Mesh(railGeo, barrierMaterial);
  rightRail.position.set(viaductWidth / 2 - 0.3, 6.0 + 1.0, 0);
  viaductGroup.add(leftRail, rightRail);

  // Viaduct Support Pillars (Japanese earthquake-grade concrete pylons)
  const pillarGeo = new THREE.CylinderGeometry(1.4, 1.8, 6.0, 16);
  for (let z = -450; z <= 450; z += 50) {
    const pillarL = new THREE.Mesh(pillarGeo, concreteMaterial);
    pillarL.position.set(-8, 3.0, z);
    pillarL.castShadow = true;
    const pillarR = new THREE.Mesh(pillarGeo, concreteMaterial);
    pillarR.position.set(8, 3.0, z);
    pillarR.castShadow = true;
    viaductGroup.add(pillarL, pillarR);
  }

  // Overhead Highway Gantries (with green Shuto Expressway signs)
  const gantryLocations = [
    { z: -350, s1: '新宿 渋谷', s2: 'Shinjuku · Shibuya', exit: '11' },
    { z: -100, s1: '銀座 湾岸線', s2: 'Ginza · Wangan Express', exit: '14' },
    { z: 150, s1: '大黒PA 首都高', s2: 'Daikoku Parking Area', exit: '19' },
    { z: 380, s1: '羽田 横浜', s2: 'Haneda · Yokohama', exit: '23' },
  ];

  gantryLocations.forEach((loc) => {
    const gantry = new THREE.Group();
    // Arch beams
    const pylonGeo = new THREE.CylinderGeometry(0.2, 0.2, 7.5, 8);
    const postL = new THREE.Mesh(pylonGeo, barrierMaterial);
    postL.position.set(-viaductWidth / 2 + 0.8, 6.0 + 3.75, loc.z);
    const postR = new THREE.Mesh(pylonGeo, barrierMaterial);
    postR.position.set(viaductWidth / 2 - 0.8, 6.0 + 3.75, loc.z);

    const crossBeamGeo = new THREE.BoxGeometry(viaductWidth - 1, 0.4, 0.4);
    const crossBeam = new THREE.Mesh(crossBeamGeo, barrierMaterial);
    crossBeam.position.set(0, 6.0 + 7.5, loc.z);

    // Green Signboard
    const signTex = createHighwayGantrySign(loc.s1, loc.s2, loc.exit);
    const signGeo = new THREE.PlaneGeometry(8, 4);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.4,
      metalness: 0.2,
      emissive: new THREE.Color(0x0a5c36),
      emissiveIntensity: 0.3,
    });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 6.0 + 5.5, loc.z - 0.2);

    gantry.add(postL, postR, crossBeam, signMesh);
    viaductGroup.add(gantry);
  });

  // Highway Streetlights
  const highwayPoleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.0, 8);
  for (let z = -460; z <= 460; z += 40) {
    const pole = new THREE.Mesh(highwayPoleGeo, barrierMaterial);
    pole.position.set(viaductWidth / 2 - 1.2, 6.0 + 3.5, z);
    const armGeo = new THREE.BoxGeometry(2.5, 0.15, 0.15);
    const arm = new THREE.Mesh(armGeo, barrierMaterial);
    arm.position.set(viaductWidth / 2 - 2.4, 6.0 + 7.0, z);

    // Light fixture
    const lamp = new THREE.PointLight(0xfff1e0, 2.2, 45, 1.2);
    lamp.position.set(viaductWidth / 2 - 3.5, 6.0 + 6.8, z);
    streetLights.push(lamp);

    viaductGroup.add(pole, arm, lamp);
  }

  root.add(viaductGroup);

  // Speed Traps on the highway
  speedTraps.push({
    id: 'wangan-radar-1',
    name: 'WANGAN SPEED TRAP #1',
    position: new THREE.Vector3(0, 6.6, 200),
    direction: new THREE.Vector3(0, 0, 1),
    width: 22,
    triggerDistance: 8,
  });

  speedTraps.push({
    id: 'shuto-radar-2',
    name: 'SHUKO EXPRESS RADAR #2',
    position: new THREE.Vector3(0, 6.6, -200),
    direction: new THREE.Vector3(0, 0, -1),
    width: 22,
    triggerDistance: 8,
  });

  // Radar camera physical box on gantry
  const radarGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const radarMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const radar1 = new THREE.Mesh(radarGeo, radarMat);
  radar1.position.set(4, 6.0 + 7.2, 200);
  const radar2 = new THREE.Mesh(radarGeo, radarMat);
  radar2.position.set(-4, 6.0 + 7.2, -200);
  root.add(radar1, radar2);

  // ==========================================
  // 2. GROUND-LEVEL SHIBUYA BOULEVARD & CROSSROADS
  // ==========================================
  const groundGroup = new THREE.Group();

  // Main ground plane (city terrain base)
  const groundBaseGeo = new THREE.PlaneGeometry(1200, 1200);
  groundBaseGeo.rotateX(-Math.PI / 2);
  const groundBaseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.95,
    metalness: 0.05,
  });
  const groundBase = new THREE.Mesh(groundBaseGeo, groundBaseMat);
  groundBase.position.y = -0.05;
  groundGroup.add(groundBase);

  // East-West intersecting avenue (X from -500 to 500 at Z = 0)
  const crossRoadGeo = new THREE.BoxGeometry(1000, 0.2, 26);
  const crossRoad = new THREE.Mesh(crossRoadGeo, roadMaterial);
  crossRoad.position.set(0, 0.05, 0);
  crossRoad.receiveShadow = true;
  groundGroup.add(crossRoad);
  roadMeshes.push(crossRoad);

  // Parallel North-South boulevard (at X = -75, Z from -500 to 500)
  const parallelRoadGeo = new THREE.BoxGeometry(22, 0.2, 1000);
  const parallelRoad = new THREE.Mesh(parallelRoadGeo, roadMaterial);
  parallelRoad.position.set(-75, 0.05, 0);
  parallelRoad.receiveShadow = true;
  groundGroup.add(parallelRoad);
  roadMeshes.push(parallelRoad);

  // Connecting loop ramps (curved access ramps between ground and elevated viaduct)
  const rampGeo = new THREE.BoxGeometry(12, 0.6, 120);
  const rampNorth = new THREE.Mesh(rampGeo, roadMaterial);
  rampNorth.rotation.x = 0.05; // slope upwards
  rampNorth.position.set(18, 3.0, 360);
  const rampSouth = new THREE.Mesh(rampGeo, roadMaterial);
  rampSouth.rotation.x = -0.05;
  rampSouth.position.set(18, 3.0, -360);
  groundGroup.add(rampNorth, rampSouth);
  roadMeshes.push(rampNorth, rampSouth);

  // ==========================================
  // 3. DAIKOKU FUTO PARKING AREA (DRIFT & MEET ZONE)
  // ==========================================
  const daikokuGroup = new THREE.Group();
  daikokuGroup.position.set(110, 0.08, -120);

  // Large asphalt plaza for drifting
  const plazaGeo = new THREE.BoxGeometry(160, 0.2, 160);
  const plazaMesh = new THREE.Mesh(plazaGeo, roadMaterial);
  plazaMesh.receiveShadow = true;
  daikokuGroup.add(plazaMesh);
  roadMeshes.push(plazaMesh);

  // Daikoku overhead parking canopy
  const canopyRoofGeo = new THREE.BoxGeometry(80, 0.8, 40);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
  const canopyRoof = new THREE.Mesh(canopyRoofGeo, canopyMat);
  canopyRoof.position.set(0, 5.5, 0);
  daikokuGroup.add(canopyRoof);

  // Neon canopy light bar
  const canopyLightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const canopyBar = new THREE.Mesh(new THREE.BoxGeometry(76, 0.2, 0.5), canopyLightMat);
  canopyBar.position.set(0, 5.1, 19.5);
  daikokuGroup.add(canopyBar);

  const daikokuLight = new THREE.PointLight(0x38bdf8, 3.0, 60);
  daikokuLight.position.set(0, 4.5, 0);
  streetLights.push(daikokuLight);
  daikokuGroup.add(daikokuLight);

  // Daikoku Welcome Billboard
  const daikokuSignTex = createTokyoNeonBillboard(1);
  const daikokuSign = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 8),
    new THREE.MeshStandardMaterial({
      map: daikokuSignTex,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 0.8,
    })
  );
  daikokuSign.position.set(0, 9.5, 20);
  daikokuGroup.add(daikokuSign);
  neonBillboards.push(daikokuSign);

  groundGroup.add(daikokuGroup);

  // ==========================================
  // 4. UNDERGROUND TUNNEL SECTION (AT X = -75, Z = 200..380)
  // ==========================================
  const tunnelGroup = new THREE.Group();
  tunnelGroup.position.set(-75, 0.1, 290);

  const tunnelLength = 180;
  const tunnelArchGeo = new THREE.CylinderGeometry(14, 14, tunnelLength, 16, 1, true, 0, Math.PI);
  tunnelArchGeo.rotateX(Math.PI / 2);
  tunnelArchGeo.rotateZ(Math.PI / 2);
  const tunnelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    side: THREE.BackSide,
  });
  const tunnelMesh = new THREE.Mesh(tunnelArchGeo, tunnelMat);
  tunnelMesh.position.y = 0;
  tunnelGroup.add(tunnelMesh);

  // Sequential amber tunnel tube strip lights
  for (let tz = -70; tz <= 70; tz += 25) {
    const stripGeo = new THREE.BoxGeometry(0.3, 0.3, 14);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const stripL = new THREE.Mesh(stripGeo, stripMat);
    stripL.position.set(-10, 8.5, tz);
    const stripR = new THREE.Mesh(stripGeo, stripMat);
    stripR.position.set(10, 8.5, tz);

    const tLight = new THREE.PointLight(0xf59e0b, 2.5, 30);
    tLight.position.set(0, 9.0, tz);
    tunnelLights.push(tLight);

    tunnelGroup.add(stripL, stripR, tLight);
  }

  groundGroup.add(tunnelGroup);

  // ==========================================
  // 5. TOKYO SKYSCRAPERS & NEON BILLBOARDS
  // ==========================================
  const cityBuildingsGroup = new THREE.Group();

  // Grid of dense Tokyo skyscrapers
  const buildingPlacements = [
    // East flank
    { x: 45, z: -280, w: 28, d: 35, h: 95, texVar: 0 },
    { x: 50, z: -180, w: 32, d: 30, h: 120, texVar: 2 },
    { x: 55, z: -70, w: 26, d: 28, h: 80, texVar: 3 },
    { x: 48, z: 80, w: 30, d: 38, h: 140, texVar: 0 },
    { x: 52, z: 220, w: 24, d: 30, h: 90, texVar: 2 },
    // West flank
    { x: -45, z: -320, w: 26, d: 32, h: 85, texVar: 2 },
    { x: -42, z: -190, w: 28, d: 28, h: 110, texVar: 0 },
    { x: -115, z: -60, w: 34, d: 34, h: 130, texVar: 3 },
    { x: -120, z: 90, w: 30, d: 30, h: 105, texVar: 2 },
    { x: -48, z: 120, w: 25, d: 32, h: 95, texVar: 0 },
    // Far skyline towers
    { x: 180, z: -80, w: 40, d: 45, h: 160, texVar: 0 },
    { x: -190, z: -120, w: 42, d: 40, h: 175, texVar: 2 },
    { x: 210, z: 140, w: 38, d: 36, h: 150, texVar: 3 },
  ];

  buildingPlacements.forEach((b) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(b.x, b.h / 2, b.z);

    const bMesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, b.h, b.d),
      b.h > 110 ? glassTowerMat : darkConcreteMat
    );
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    bGroup.add(bMesh);

    // Glowing Neon Billboard on facade
    const billboardTex = createTokyoNeonBillboard(b.texVar);
    const billboardMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(b.w * 0.75, b.h * 0.28),
      new THREE.MeshStandardMaterial({
        map: billboardTex,
        emissive: new THREE.Color(b.texVar === 0 ? 0xec4899 : b.texVar === 2 ? 0x0284c7 : 0xf59e0b),
        emissiveIntensity: 0.9,
      })
    );
    // Face the billboard toward the road
    if (b.x > 0) {
      billboardMesh.position.set(-b.w / 2 - 0.2, 0, 0);
      billboardMesh.rotation.y = -Math.PI / 2;
    } else {
      billboardMesh.position.set(b.w / 2 + 0.2, 0, 0);
      billboardMesh.rotation.y = Math.PI / 2;
    }
    bGroup.add(billboardMesh);
    neonBillboards.push(billboardMesh);

    cityBuildingsGroup.add(bGroup);

    // Add to collision bounding boxes
    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      new THREE.Vector3(b.x, b.h / 2, b.z),
      new THREE.Vector3(b.w, b.h, b.d)
    );
    collisionBoxes.push(box);
  });

  groundGroup.add(cityBuildingsGroup);

  // ==========================================
  // 6. ICONIC TOKYO TOWER (SKYLINE HERO LANDMARK)
  // ==========================================
  const tokyoTowerGroup = new THREE.Group();
  tokyoTowerGroup.position.set(280, 0, -220); // Dominating the Tokyo skyline

  const towerOrange = new THREE.MeshStandardMaterial({
    color: 0xe11d48, // Iconic Tokyo Tower international orange
    metalness: 0.7,
    roughness: 0.3,
  });

  const towerWhite = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Base 4 arched structural steel legs
  const legGeo = new THREE.CylinderGeometry(1.5, 3.5, 50, 8);
  const legPositions = [
    [-18, 25, -18],
    [18, 25, -18],
    [-18, 25, 18],
    [18, 25, 18],
  ];
  legPositions.forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, towerOrange);
    leg.position.set(lx, ly, lz);
    tokyoTowerGroup.add(leg);
  });

  // Main observation deck platform
  const deckMesh = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 12, 16), towerWhite);
  deckMesh.position.y = 56;
  tokyoTowerGroup.add(deckMesh);

  // Middle lattice shaft (alternating orange and white sections)
  const shaft1 = new THREE.Mesh(new THREE.CylinderGeometry(7, 12, 60, 12), towerOrange);
  shaft1.position.y = 92;
  const shaft2 = new THREE.Mesh(new THREE.CylinderGeometry(4, 7, 50, 12), towerWhite);
  shaft2.position.y = 147;
  const shaft3 = new THREE.Mesh(new THREE.CylinderGeometry(2, 4, 45, 12), towerOrange);
  shaft3.position.y = 194.5;

  // Upper special observation deck & spire antenna
  const topDeck = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.5, 6, 16), towerWhite);
  topDeck.position.y = 220;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.8, 65, 8), towerWhite);
  spire.position.y = 255.5;

  // Flashing red aviation beacon on top
  const beaconLight = new THREE.PointLight(0xef4444, 4.0, 300);
  beaconLight.position.y = 290;
  tokyoTowerLights.push(beaconLight);

  tokyoTowerGroup.add(shaft1, shaft2, shaft3, topDeck, spire, beaconLight);
  root.add(tokyoTowerGroup);

  // ==========================================
  // 7. SAKURA BLOSSOM TREES & JAPANESE STREET PROPS
  // ==========================================
  const sakuraGroup = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // Vibrant Sakura Pink
    roughness: 0.6,
    metalness: 0.05,
  });

  for (let i = 0; i < 28; i++) {
    const tree = new THREE.Group();
    const tx = i % 2 === 0 ? -22 : 22;
    const tz = -400 + i * 28;

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4, 8), trunkMat);
    trunk.position.y = 2;

    const crown1 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), foliageMat);
    crown1.position.set(0, 4.2, 0);
    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), foliageMat);
    crown2.position.set(0.8, 4.8, 0.4);

    tree.add(trunk, crown1, crown2);
    tree.position.set(tx, 0, tz);
    sakuraGroup.add(tree);
  }
  groundGroup.add(sakuraGroup);

  root.add(groundGroup);

  // ==========================================
  // 8. RACE CHECKPOINTS & AI RACER WAYPOINTS
  // ==========================================
  // Circuit loop: Shuto Expressway -> Ramp -> Shibuya Avenue -> Daikoku -> Tunnel -> Loop
  const raceCheckpoints: Checkpoint[] = [
    { id: 1, position: new THREE.Vector3(0, 6.6, -400), radius: 14 },
    { id: 2, position: new THREE.Vector3(0, 6.6, -150), radius: 14 },
    { id: 3, position: new THREE.Vector3(0, 6.6, 150), radius: 14 },
    { id: 4, position: new THREE.Vector3(14, 4.0, 340), radius: 16 }, // Highway exit ramp
    { id: 5, position: new THREE.Vector3(-40, 0.6, 320), radius: 18 },
    { id: 6, position: new THREE.Vector3(-75, 0.6, 100), radius: 16 }, // Tunnel entrance
    { id: 7, position: new THREE.Vector3(-75, 0.6, -100), radius: 16 },
    { id: 8, position: new THREE.Vector3(110, 0.6, -120), radius: 24 }, // Daikoku Drift Plaza
    { id: 9, position: new THREE.Vector3(18, 3.2, -340), radius: 16 }, // On-ramp back to Shuto
  ];

  const aiWaypoints: THREE.Vector3[] = raceCheckpoints.map((cp) => cp.position.clone());

  // Function to adjust environment visuals based on time and wetness
  const updateTimeVisuals = (isNight: boolean, wetness: number) => {
    roadMaterial.roughness = THREE.MathUtils.lerp(0.75, 0.15, wetness);
    roadMaterial.metalness = THREE.MathUtils.lerp(0.1, 0.4, wetness);

    neonBillboards.forEach((b) => {
      const mat = b.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isNight ? 1.4 : 0.4;
    });

    streetLights.forEach((light) => {
      light.intensity = isNight ? 2.5 : 0.05;
    });

    tunnelLights.forEach((light) => {
      light.intensity = 2.4; // always on inside tunnel
    });
  };

  return {
    root,
    roadMeshes,
    collisionBoxes,
    speedTraps,
    raceCheckpoints,
    aiWaypoints,
    neonBillboards,
    streetLights,
    tunnelLights,
    tokyoTowerLights,
    updateTimeVisuals,
  };
}
