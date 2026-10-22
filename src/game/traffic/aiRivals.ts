/**
 * Autonomous AI Rival Supercars & Race Logic
 * Features 3 rival racers navigating the Tokyo circuit loop with dynamic
 * overtaking, speed management, and position leaderboard tracking.
 */

import * as THREE from 'three';
import { createSupercarModel, CarModelInstance } from '../cars/carModels';

export interface AIRival {
  id: string;
  name: string;
  carName: string;
  model: CarModelInstance;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speedKmh: number;
  currentWaypointIndex: number;
  currentLap: number;
  lapProgress: number; // 0 to 1
  baseSpeedKmh: number;
  heading: number;
}

export class AIRivalManager {
  public rivals: AIRival[] = [];
  private waypoints: THREE.Vector3[] = [];

  constructor(scene: THREE.Scene, waypoints: THREE.Vector3[]) {
    this.waypoints = waypoints;

    const rivalConfigs = [
      {
        id: 'rival-gtr',
        name: 'TAKUMI · R34',
        carName: 'Skyline GT-R',
        carId: 'skyline-gtr-r34',
        color: '#7e22ce', // Midnight Purple
        startOffset: -30,
        baseSpeed: 275,
      },
      {
        id: 'rival-gt3',
        name: 'KLAUS · GT3 RS',
        carName: '911 GT3 RS',
        carId: 'porsche-gt3-rs',
        color: '#dc2626', // Guards Red
        startOffset: -65,
        baseSpeed: 260,
      },
      {
        id: 'rival-jesko',
        name: 'AXEL · JESKO',
        carName: 'Jesko Absolut',
        carId: 'koenigsegg-jesko',
        color: '#f8fafc', // Ghost White
        startOffset: -100,
        baseSpeed: 295,
      },
    ];

    rivalConfigs.forEach((cfg) => {
      const model = createSupercarModel(cfg.carId, cfg.color);
      scene.add(model.root);

      const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        6.6,
        -400 + cfg.startOffset
      );
      model.root.position.copy(startPos);

      this.rivals.push({
        id: cfg.id,
        name: cfg.name,
        carName: cfg.carName,
        model,
        position: startPos,
        velocity: new THREE.Vector3(0, 0, 1),
        speedKmh: 0,
        currentWaypointIndex: 0,
        currentLap: 1,
        lapProgress: 0,
        baseSpeedKmh: cfg.baseSpeed,
        heading: 0,
      });
    });
  }

  public update(delta: number, playerPos: THREE.Vector3): { playerRank: number; totalRacers: number } {
    const dt = Math.min(delta, 0.05);

    this.rivals.forEach((rival, idx) => {
      if (this.waypoints.length === 0) return;

      const targetWp = this.waypoints[rival.currentWaypointIndex];
      const toTarget = targetWp.clone().sub(rival.position);
      const distance = toTarget.length();

      // Advance waypoint
      if (distance < 16) {
        rival.currentWaypointIndex = (rival.currentWaypointIndex + 1) % this.waypoints.length;
        if (rival.currentWaypointIndex === 0) {
          rival.currentLap++;
        }
      }

      // Desired heading towards next waypoint
      const targetHeading = Math.atan2(toTarget.x, toTarget.z);
      rival.heading = THREE.MathUtils.damp(rival.heading, targetHeading, 6.0, dt);

      // Target speed with slight rubber-banding / competitive tension
      const distToPlayer = rival.position.distanceTo(playerPos);
      let targetSpeed = rival.baseSpeedKmh;
      if (distToPlayer > 80 && rival.position.z < playerPos.z) {
        targetSpeed += 25; // catch up
      }

      // Decelerate into sharp corners
      const headingDiff = Math.abs(targetHeading - rival.heading);
      if (headingDiff > 0.4) {
        targetSpeed *= 0.65;
      }

      rival.speedKmh = THREE.MathUtils.damp(rival.speedKmh, targetSpeed, 4.0, dt);
      const forwardMps = (rival.speedKmh / 3.6);

      // Lane offset so rivals don't all ride the exact same line
      const laneOffset = (idx - 1) * 3.2;
      const moveVec = new THREE.Vector3(Math.sin(rival.heading), 0, Math.cos(rival.heading))
        .multiplyScalar(forwardMps * dt);

      rival.position.add(moveVec);
      rival.position.x += laneOffset * 0.01;

      // Follow road elevation
      rival.position.y = targetWp.y;

      // Update 3D mesh transform
      rival.model.root.position.copy(rival.position);
      rival.model.root.rotation.set(0, rival.heading, 0);

      // Spin wheels
      const wheelSpin = (forwardMps / 0.38) * dt;
      rival.model.wheels.forEach((w) => {
        w.children[0]?.rotateX(wheelSpin);
      });

      // Update lap progress
      rival.lapProgress = (rival.currentLap - 1) + (rival.currentWaypointIndex / this.waypoints.length);
    });

    // Calculate player race rank
    let playerRank = 1;
    // Estimate player's progress along the loop
    const playerZ = playerPos.z;
    this.rivals.forEach((rival) => {
      if (rival.position.z > playerZ) {
        playerRank++;
      }
    });

    return {
      playerRank: Math.min(playerRank, this.rivals.length + 1),
      totalRacers: this.rivals.length + 1,
    };
  }

  public resetPositions() {
    this.rivals.forEach((rival, idx) => {
      rival.position.set((idx - 1) * 4, 6.6, -420 - idx * 25);
      rival.currentWaypointIndex = 0;
      rival.currentLap = 1;
      rival.lapProgress = 0;
      rival.speedKmh = 0;
      rival.heading = 0;
      rival.model.root.position.copy(rival.position);
      rival.model.root.rotation.set(0, 0, 0);
    });
  }
}
