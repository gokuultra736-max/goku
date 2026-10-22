/**
 * Dynamic Day-Night Cycle & Realistic Weather System
 * Inspired by CarX Street & Forza Horizon
 * Real-time 24h orbital lighting, atmospheric fog, rain particle streaks,
 * wet road reflection multipliers, and storm lightning flashes.
 */

import * as THREE from 'three';
import { WeatherType } from '../../types';
import { soundEngine } from '../sound/soundEngine';

export interface WeatherState {
  timeOfDay: number; // 0.0 to 24.0
  weatherType: WeatherType;
  wetness: number; // 0.0 (dry) to 1.0 (water puddles & spray)
  isNight: boolean;
  sunPosition: THREE.Vector3;
  lightningActive: boolean;
}

export class WeatherSystem {
  public timeOfDay: number = 21.5; // Start at iconic Tokyo Neon Night (9:30 PM)
  public timeSpeed: number = 0.2; // 1 real second = 0.2 game minutes
  public isTimePaused: boolean = false;
  public currentWeather: WeatherType = 'night';
  public wetness: number = 0.4; // slight Tokyo drizzle gloss

  // Scene references
  private scene: THREE.Scene;
  private dirSunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private fog: THREE.FogExp2;
  private skyMesh: THREE.Mesh;

  // Rain particle system
  private rainParticles: THREE.Points | null = null;
  private rainGeometry: THREE.BufferGeometry | null = null;
  private rainPositions: Float32Array | null = null;
  private readonly rainCount: number = 1800;

  // Lightning system for storms
  private lightningTimer: number = 0;
  private isLightningFlashing: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Directional Sun / Moon Light with soft shadows
    this.dirSunLight = new THREE.DirectionalLight(0xfff4e6, 2.0);
    this.dirSunLight.position.set(100, 150, 100);
    this.dirSunLight.castShadow = true;
    this.dirSunLight.shadow.mapSize.width = 2048;
    this.dirSunLight.shadow.mapSize.height = 2048;
    this.dirSunLight.shadow.camera.near = 0.5;
    this.dirSunLight.shadow.camera.far = 400;
    this.dirSunLight.shadow.camera.left = -120;
    this.dirSunLight.shadow.camera.right = 120;
    this.dirSunLight.shadow.camera.top = 120;
    this.dirSunLight.shadow.camera.bottom = -120;
    this.dirSunLight.shadow.bias = -0.0005;
    this.scene.add(this.dirSunLight);

    // 2. Hemisphere ambient light (warm sky / cool asphalt ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.8);
    this.scene.add(this.hemiLight);

    // 3. Volumetric Fog
    this.fog = new THREE.FogExp2(0x0a0e1a, 0.0028);
    this.scene.fog = this.fog;

    // 4. Large Celestial Sky Dome
    const skyGeo = new THREE.SphereGeometry(650, 24, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x050813,
      side: THREE.BackSide,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    this.setupRainSystem();
    this.applyAtmosphere();
  }

  private setupRainSystem() {
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 120;
      this.rainPositions[i * 3 + 1] = Math.random() * 50;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.65,
    });

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public setWeather(type: WeatherType) {
    this.currentWeather = type;
    if (type === 'rain' || type === 'storm') {
      this.wetness = 0.95;
    } else if (type === 'sunset') {
      this.timeOfDay = 18.0;
      this.wetness = 0.1;
    } else if (type === 'night') {
      this.timeOfDay = 22.0;
      this.wetness = 0.35;
    } else if (type === 'clear') {
      this.timeOfDay = 13.0;
      this.wetness = 0.0;
    } else if (type === 'fog') {
      this.wetness = 0.6;
    }
    this.applyAtmosphere();
  }

  public setTimeOfDay(hour: number) {
    this.timeOfDay = ((hour % 24) + 24) % 24;
    this.applyAtmosphere();
  }

  public update(delta: number, carPosition: THREE.Vector3): WeatherState {
    // Progress dynamic time if not paused
    if (!this.isTimePaused) {
      this.timeOfDay = (this.timeOfDay + delta * this.timeSpeed * (24 / 60)) % 24;
    }

    // Dynamic wetness decay or increase
    const targetWetness = this.currentWeather === 'rain' || this.currentWeather === 'storm' ? 1.0 : this.currentWeather === 'fog' ? 0.6 : 0.0;
    this.wetness = THREE.MathUtils.damp(this.wetness, targetWetness, 0.4, delta);

    this.applyAtmosphere();

    // Update Rain streaks around the player car
    const isRaining = this.currentWeather === 'rain' || this.currentWeather === 'storm';
    if (this.rainParticles && this.rainPositions) {
      this.rainParticles.visible = isRaining;
      if (isRaining) {
        this.rainParticles.position.set(carPosition.x, 0, carPosition.z);
        const posAttr = this.rainGeometry!.getAttribute('position');
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < this.rainCount; i++) {
          const yIdx = i * 3 + 1;
          posArray[yIdx] -= delta * 45; // fall speed
          if (posArray[yIdx] < 0) {
            posArray[yIdx] = 45;
            posArray[i * 3] = (Math.random() - 0.5) * 110;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 110;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // Handle dramatic storm lightning
    let lightningTriggered = false;
    if (this.currentWeather === 'storm') {
      this.lightningTimer += delta;
      if (this.lightningTimer > 5.5 + Math.random() * 4) {
        this.lightningTimer = 0;
        this.isLightningFlashing = true;
        lightningTriggered = true;
        soundEngine.triggerThunder();
        window.setTimeout(() => {
          this.isLightningFlashing = false;
        }, 120);
      }
    } else {
      this.isLightningFlashing = false;
    }

    // Sky follows car horizontally so horizon stays infinite
    this.skyMesh.position.set(carPosition.x, 0, carPosition.z);

    const isNight = this.timeOfDay < 6.0 || this.timeOfDay > 18.5;

    return {
      timeOfDay: this.timeOfDay,
      weatherType: this.currentWeather,
      wetness: this.wetness,
      isNight,
      sunPosition: this.dirSunLight.position,
      lightningActive: this.isLightningFlashing,
    };
  }

  private applyAtmosphere() {
    const hour = this.timeOfDay;
    // Calculate sun angle: 12.0 = zenith (90 deg), 6.0 = dawn, 18.0 = sunset, 0.0 = nadir
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const sunCos = Math.cos(sunAngle);

    this.dirSunLight.position.set(sunCos * 200, Math.max(sunHeight * 220, -50), 100);

    const skyMat = this.skyMesh.material as THREE.MeshBasicMaterial;

    if (this.isLightningFlashing) {
      // Thunder flash highlights everything white-cyan
      this.dirSunLight.color.setHex(0xdbeafe);
      this.dirSunLight.intensity = 8.0;
      this.hemiLight.intensity = 4.0;
      this.fog.color.setHex(0x93c5fd);
      skyMat.color.setHex(0xbfdbfe);
      return;
    }

    if (this.currentWeather === 'storm') {
      // Dark stormy tempest
      this.dirSunLight.color.setHex(0x64748b);
      this.dirSunLight.intensity = 0.4;
      this.hemiLight.color.setHex(0x334155);
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.hemiLight.intensity = 0.35;
      this.fog.color.setHex(0x0f172a);
      this.fog.density = 0.0055;
      skyMat.color.setHex(0x0a0f1d);
    } else if (this.currentWeather === 'fog') {
      // Dense Tokyo Bay Mist
      this.dirSunLight.intensity = 0.6;
      this.fog.color.setHex(0x334155);
      this.fog.density = 0.012; // High density fog
      this.hemiLight.intensity = 0.5;
      skyMat.color.setHex(0x1e293b);
    } else if (hour >= 6.0 && hour < 17.0) {
      // Daylight / Noon
      const dayFactor = Math.sin(((hour - 6) / 11) * Math.PI);
      this.dirSunLight.color.setHex(0xfff7ed);
      this.dirSunLight.intensity = 1.8 * dayFactor + 0.3;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.7 * dayFactor + 0.2;
      this.fog.color.setHex(0x7dd3fc);
      this.fog.density = 0.0018;
      skyMat.color.setHex(0x0284c7);
    } else if (hour >= 17.0 && hour < 19.5) {
      // Tokyo Golden Hour & Neon Twilight
      const sunsetFactor = 1 - (hour - 17.0) / 2.5;
      this.dirSunLight.color.setHex(0xf97316); // Golden sunset orange
      this.dirSunLight.intensity = 1.6 * sunsetFactor + 0.2;
      this.hemiLight.color.setHex(0xd946ef); // Magenta/purple dusk
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.hemiLight.intensity = 0.55;
      this.fog.color.setHex(0x581c87); // Deep purple horizon fog
      this.fog.density = 0.0028;
      skyMat.color.setHex(0x3b0764);
    } else {
      // Cyberpunk Tokyo Night (Deep indigo, stars, neon reflections)
      this.dirSunLight.color.setHex(0x60a5fa); // Cool moonlight
      this.dirSunLight.intensity = 0.25;
      this.hemiLight.color.setHex(0x06b6d4); // Cyan neon skylight
      this.hemiLight.groundColor.setHex(0x05070f);
      this.hemiLight.intensity = 0.45;
      this.fog.color.setHex(0x050814);
      this.fog.density = 0.0026;
      skyMat.color.setHex(0x030611);
    }
  }
}
