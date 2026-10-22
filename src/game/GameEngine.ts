/**
 * Main 3D Game Engine for Tokyo Horizon: Shuto Express
 * Manages Three.js WebGL renderer, RoomEnvironment PBR reflections,
 * physics loop, particle systems, multi-camera angles, speed traps, and audio.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CameraView, CarSpec, VehicleTelemetry, WeatherType } from '../types';
import { soundEngine } from './sound/soundEngine';
import { inputManager, InputState } from './input/gamepadManager';
import { createSupercarModel, CarModelInstance, SUPERCAR_SPECS } from './cars/carModels';
import { buildTokyoWorld, TokyoWorldResult } from './world/tokyoWorld';
import { WeatherSystem } from './world/weatherSystem';
import { VehiclePhysics } from './physics/vehiclePhysics';
import { AIRivalManager } from './traffic/aiRivals';

export class GameEngine {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private pmremGenerator!: THREE.PMREMGenerator;

  // Subsystems
  private world!: TokyoWorldResult;
  private weatherSystem!: WeatherSystem;
  private physics!: VehiclePhysics;
  private rivalManager!: AIRivalManager;
  private playerCarModel!: CarModelInstance;

  // Particle systems
  private exhaustFlameParticles!: THREE.Points;
  private tireSmokeParticles!: THREE.Points;
  private waterSprayParticles!: THREE.Points;
  private exhaustFlameGeo!: THREE.BufferGeometry;
  private tireSmokeGeo!: THREE.BufferGeometry;
  private waterSprayGeo!: THREE.BufferGeometry;

  // Camera settings
  public cameraMode: CameraView = 'chase';
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private droneAngle: number = 0;

  // Game state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private animationFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private isSoftwareGl: boolean = false;

  // Telemetry callback to React UI
  private onTelemetryUpdate?: (telemetry: VehicleTelemetry, weatherState: { timeOfDay: number; weather: WeatherType; wetness: number }) => void;
  private onSpeedTrapTriggered?: (speed: number, trapName: string) => void;

  // Race stats
  private lapStartTime: number = 0;
  private currentLapTime: number = 0;
  private bestLapTime: number = 0;
  private currentLap: number = 1;
  private currentCheckpointIdx: number = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.initRenderer();
    this.initScene();
    this.initWorld();
    this.initCar('bugatti-bolide');
    this.initParticles();
    this.initRivals();

    window.addEventListener('resize', this.onWindowResize);
  }

  private initRenderer() {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    const contextAttributes: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
    };

    let glContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;

    // Progressive context acquisition fallback for ANGLE / Intel / Mobile / Android TV
    try {
      glContext = canvas.getContext('webgl2', contextAttributes);
    } catch {
      // Ignore webgl2 failure and fallback to webgl
    }

    if (!glContext) {
      try {
        glContext = (canvas.getContext('webgl', contextAttributes) || canvas.getContext('experimental-webgl', contextAttributes)) as WebGLRenderingContext | null;
      } catch {
        // Fallback to default
      }
    }

    // Detect software rendering directly on active context without separate dummy canvas
    if (glContext) {
      try {
        const gl = glContext as WebGLRenderingContext;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        this.isSoftwareGl = true;
      }
    }

    const rendererOptions: THREE.WebGLRendererParameters = {
      canvas,
      antialias: false,
      powerPreference: 'default',
      alpha: false,
      failIfMajorPerformanceCaveat: false,
    };

    if (glContext) {
      rendererOptions.context = glContext as unknown as WebGLRenderingContext;
    }

    this.renderer = new THREE.WebGLRenderer(rendererOptions);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      62,
      this.container.clientWidth / this.container.clientHeight,
      0.2,
      900
    );

    // Studio Environment map with safe fallback if PMREM isn't supported on restricted GL1 drivers
    try {
      this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      this.pmremGenerator.dispose();
    } catch {
      // Fallback: Scene uses directional + hemisphere lights seamlessly
    }
  }

  private initWorld() {
    this.world = buildTokyoWorld();
    this.scene.add(this.world.root);
    this.weatherSystem = new WeatherSystem(this.scene);
  }

  private initCar(carId: string, customColor?: string) {
    if (this.playerCarModel) {
      this.scene.remove(this.playerCarModel.root);
    }

    const selectedSpec = SUPERCAR_SPECS.find((c) => c.id === carId) || SUPERCAR_SPECS[0];
    this.playerCarModel = createSupercarModel(carId, customColor);
    this.scene.add(this.playerCarModel.root);

    if (!this.physics) {
      this.physics = new VehiclePhysics(selectedSpec, new THREE.Vector3(0, 6.6, -420));
    } else {
      this.physics.setSpec(selectedSpec);
    }

    soundEngine.setEngineType(selectedSpec.engineSoundType);
  }

  private initRivals() {
    this.rivalManager = new AIRivalManager(this.scene, this.world.aiWaypoints);
  }

  private initParticles() {
    // 1. Exhaust Flame Particle System (Blue/Orange bursts)
    const flameCount = 48;
    this.exhaustFlameGeo = new THREE.BufferGeometry();
    const flamePositions = new Float32Array(flameCount * 3);
    this.exhaustFlameGeo.setAttribute('position', new THREE.BufferAttribute(flamePositions, 3));
    const flameMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.exhaustFlameParticles = new THREE.Points(this.exhaustFlameGeo, flameMat);
    this.exhaustFlameParticles.visible = false;
    this.scene.add(this.exhaustFlameParticles);

    // 2. Tire Smoke Particle System
    const smokeCount = 120;
    this.tireSmokeGeo = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount * 3; i++) smokePositions[i] = 0;
    this.tireSmokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 1.2,
      transparent: true,
      opacity: 0.35,
    });
    this.tireSmokeParticles = new THREE.Points(this.tireSmokeGeo, smokeMat);
    this.scene.add(this.tireSmokeParticles);

    // 3. Water Spray Particles (CarX style wet roostertail)
    const sprayCount = 140;
    this.waterSprayGeo = new THREE.BufferGeometry();
    const sprayPositions = new Float32Array(sprayCount * 3);
    this.waterSprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
    const sprayMat = new THREE.PointsMaterial({
      color: 0xbfdbfe,
      size: 0.65,
      transparent: true,
      opacity: 0.45,
    });
    this.waterSprayParticles = new THREE.Points(this.waterSprayGeo, sprayMat);
    this.scene.add(this.waterSprayParticles);
  }

  public setCallbacks(
    onTelemetry: (telemetry: VehicleTelemetry, weatherState: { timeOfDay: number; weather: WeatherType; wetness: number }) => void,
    onSpeedTrap?: (speed: number, trapName: string) => void
  ) {
    this.onTelemetryUpdate = onTelemetry;
    this.onSpeedTrapTriggered = onSpeedTrap;
  }

  public changeCar(carId: string, customColor?: string) {
    const currentPos = this.physics.position.clone();
    const currentHeading = this.physics.headingAngle;
    this.initCar(carId, customColor);
    this.physics.resetPosition(currentPos, currentHeading);
  }

  public setWeather(weather: WeatherType) {
    this.weatherSystem.setWeather(weather);
  }

  public setTimeOfDay(hour: number) {
    this.weatherSystem.setTimeOfDay(hour);
  }

  public setCameraView(view: CameraView) {
    this.cameraMode = view;
  }

  public resetCarOnTrack() {
    // Reset to nearest highway or starting grid
    const targetY = this.physics.position.y > 4 ? 6.6 : 0.6;
    this.physics.resetPosition(new THREE.Vector3(0, targetY, this.physics.position.z), 0);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    soundEngine.init();
    this.lapStartTime = performance.now();
    this.loop();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.clock.getDelta(); // reset delta accumulator
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  private loop = () => {
    if (!this.isRunning) return;

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.05);

    if (!this.isPaused) {
      this.tick(delta);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.loop);
    } else {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer ? this.renderer.getContext() : null;
    if (gl && 'fenceSync' in gl && typeof (gl as WebGL2RenderingContext).fenceSync === 'function') {
      try {
        const gl2 = gl as WebGL2RenderingContext;
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl2.flush();
        const poll = () => {
          const state = sync && gl2.getSyncParameter(sync, gl2.SYNC_STATUS);
          if (state === gl2.UNSIGNALED) {
            window.setTimeout(poll, 5);
          } else {
            if (sync) gl2.deleteSync(sync);
            window.setTimeout(cb, 60);
          }
        };
        window.setTimeout(poll, 5);
        return;
      } catch {
        // Fallback to standard timer pacing
      }
    }
    window.setTimeout(cb, 60);
  }

  private tick(delta: number) {
    // 1. Poll input (Bluetooth Gamepad, TV remote, or Keyboard)
    const input = inputManager.poll();

    // Edge triggers
    if (input.toggleCamera) {
      const modes: CameraView[] = ['chase', 'cockpit', 'hood', 'drone'];
      const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
      this.cameraMode = modes[nextIdx];
    }
    if (input.resetCar) {
      this.resetCarOnTrack();
    }

    // 2. Update Weather and Atmosphere
    const weatherState = this.weatherSystem.update(delta, this.physics.position);
    this.world.updateTimeVisuals(weatherState.isNight, weatherState.wetness);

    // 3. Update Vehicle Physics
    const physicsOutput = this.physics.update(
      delta,
      input,
      this.world.collisionBoxes,
      weatherState.wetness
    );

    // Haptic rumble on controller during crash or redline rev-limiter
    if (physicsOutput.hitImpulse) {
      inputManager.triggerVibration(180, 0.9, 0.7);
    } else if (this.physics.rpm > 7900) {
      inputManager.triggerVibration(40, 0.2, 0.3); // engine redline buzz
    }

    // 4. Update 3D Player Car Model
    this.playerCarModel.root.position.copy(this.physics.position);
    this.playerCarModel.root.rotation.copy(this.physics.rotation);

    // Steer front wheels
    this.playerCarModel.wheelSteerGroups.forEach((steerGroup) => {
      steerGroup.rotation.y = this.physics.steerAngle;
    });

    // Spin wheels according to forward speed
    const wheelRotSpeed = (this.physics.speedKmh / 3.6 / 0.38) * delta;
    this.playerCarModel.wheels.forEach((w) => {
      w.children[0]?.rotateX(wheelRotSpeed);
    });

    // Update brake lights and headlamps
    const isBraking = input.brake > 0.1 || input.handbrake;
    const isReversing = this.physics.isReverse;
    const isNitroFiring = input.nitro && this.physics.nitroAmount > 0;
    this.playerCarModel.updateVisuals(isBraking, isReversing, isNitroFiring);

    // 5. Update AI Rivals & Leaderboard
    const raceRankInfo = this.rivalManager.update(delta, this.physics.position);

    // 6. Checkpoint & Lap Tracking
    this.updateRaceCheckpoints();

    // 7. Speed Traps Check
    this.checkSpeedTraps();

    // 8. Update Particles (Flames, Tire Smoke, Water Spray)
    this.updateParticles(delta, physicsOutput.exhaustBackfire, physicsOutput.tireSmoke, physicsOutput.waterSpray);

    // 9. Update Procedural Sound Engine
    soundEngine.update({
      rpm: this.physics.rpm,
      maxRpm: this.physics.spec.engineSoundType === 'flat6' ? 9200 : 8200,
      throttle: input.throttle,
      speedKmh: this.physics.speedKmh,
      slipAngle: this.physics.slipAngle,
      isDrifting: this.physics.isDrifting,
      isNitro: isNitroFiring,
      isRaining: weatherState.weatherType === 'rain' || weatherState.weatherType === 'storm',
    });

    // 10. Update Camera
    this.updateCamera(delta, input);

    // 11. Dispatch Telemetry to React UI
    this.currentLapTime = (performance.now() - this.lapStartTime) / 1000;
    physicsOutput.telemetry.lapTime = Number(this.currentLapTime.toFixed(2));
    physicsOutput.telemetry.currentLap = this.currentLap;
    physicsOutput.telemetry.racePosition = raceRankInfo.playerRank;
    physicsOutput.telemetry.totalRacers = raceRankInfo.totalRacers;

    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate(physicsOutput.telemetry, {
        timeOfDay: weatherState.timeOfDay,
        weather: weatherState.weatherType,
        wetness: weatherState.wetness,
      });
    }
  }

  private updateRaceCheckpoints() {
    const cps = this.world.raceCheckpoints;
    if (cps.length === 0) return;

    const nextCp = cps[this.currentCheckpointIdx];
    const dist = this.physics.position.distanceTo(nextCp.position);

    if (dist < nextCp.radius) {
      this.currentCheckpointIdx = (this.currentCheckpointIdx + 1) % cps.length;
      if (this.currentCheckpointIdx === 0) {
        // Completed lap!
        this.currentLap++;
        if (this.bestLapTime === 0 || this.currentLapTime < this.bestLapTime) {
          this.bestLapTime = this.currentLapTime;
        }
        this.lapStartTime = performance.now();
      }
    }
  }

  private checkSpeedTraps() {
    for (const trap of this.world.speedTraps) {
      const dist = this.physics.position.distanceTo(trap.position);
      if (dist < trap.triggerDistance && this.physics.speedKmh > 120) {
        soundEngine.triggerSpeedCameraChime();
        inputManager.triggerVibration(120, 0.7, 0.5);
        if (this.onSpeedTrapTriggered) {
          this.onSpeedTrapTriggered(Math.round(this.physics.speedKmh), trap.name);
        }
        break;
      }
    }
  }

  private updateParticles(delta: number, backfire: boolean, smoke: boolean, spray: boolean) {
    // Exhaust backfire flames
    if (backfire && this.playerCarModel.exhaustPoints.length > 0) {
      this.exhaustFlameParticles.visible = true;
      const pts = this.playerCarModel.exhaustPoints;
      const positions = (this.exhaustFlameGeo.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;

      for (let i = 0; i < positions.length / 3; i++) {
        const pt = pts[i % pts.length];
        const worldPt = pt.clone().applyEuler(this.physics.rotation).add(this.physics.position);
        positions[i * 3] = worldPt.x + (Math.random() - 0.5) * 0.12;
        positions[i * 3 + 1] = worldPt.y + (Math.random() - 0.5) * 0.12;
        positions[i * 3 + 2] = worldPt.z + (Math.random() - 0.5) * 0.25;
      }
      this.exhaustFlameGeo.getAttribute('position').needsUpdate = true;
    } else {
      this.exhaustFlameParticles.visible = false;
    }

    // Tire smoke particles during dry drifts
    if (smoke) {
      const posAttr = this.tireSmokeGeo.getAttribute('position') as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      const rearLeft = new THREE.Vector3(-0.9, 0.2, -1.3).applyEuler(this.physics.rotation).add(this.physics.position);
      const rearRight = new THREE.Vector3(0.9, 0.2, -1.3).applyEuler(this.physics.rotation).add(this.physics.position);

      for (let i = 0; i < array.length / 3; i++) {
        if (Math.random() < 0.2) {
          const origin = i % 2 === 0 ? rearLeft : rearRight;
          array[i * 3] = origin.x + (Math.random() - 0.5) * 0.4;
          array[i * 3 + 1] = origin.y + Math.random() * 0.6;
          array[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.4;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Water spray roostertail during rain
    if (spray && this.physics.speedKmh > 30) {
      const posAttr = this.waterSprayGeo.getAttribute('position') as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      const rearCenter = new THREE.Vector3(0, 0.4, -2.0).applyEuler(this.physics.rotation).add(this.physics.position);

      for (let i = 0; i < array.length / 3; i++) {
        if (Math.random() < 0.25) {
          array[i * 3] = rearCenter.x + (Math.random() - 0.5) * 1.2;
          array[i * 3 + 1] = rearCenter.y + Math.random() * 1.4;
          array[i * 3 + 2] = rearCenter.z - Math.random() * 3.5;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  private updateCamera(delta: number, input: InputState) {
    const carPos = this.physics.position;
    const heading = this.physics.headingAngle;
    const speedRatio = Math.min(this.physics.speedKmh / 400, 1.0);

    // Dynamic FOV stretch during high-speed blasts & nitro
    const targetFov = 60 + speedRatio * 18 + (input.nitro ? 8 : 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4, delta);
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'chase') {
      // Dynamic chase cam with drift swing & slight lag
      const camDist = 6.8 + speedRatio * 2.2;
      const camHeight = 2.4 - this.physics.pitchAngle * 4;

      // Slight camera swing into drift angle
      const swingOffset = this.physics.slipAngle * 0.45;
      const camX = carPos.x - Math.sin(heading + swingOffset) * camDist;
      const camZ = carPos.z - Math.cos(heading + swingOffset) * camDist;
      const camY = carPos.y + camHeight;

      this.camera.position.set(
        THREE.MathUtils.damp(this.camera.position.x, camX, 10, delta),
        THREE.MathUtils.damp(this.camera.position.y, camY, 10, delta),
        THREE.MathUtils.damp(this.camera.position.z, camZ, 10, delta)
      );

      const lookAhead = carPos.clone().add(new THREE.Vector3(Math.sin(heading) * 12, 0.8, Math.cos(heading) * 12));
      this.cameraTarget.lerp(lookAhead, delta * 12);
      this.camera.lookAt(this.cameraTarget);
    } else if (this.cameraMode === 'cockpit') {
      // Driver cabin viewpoint
      const cabinOffset = new THREE.Vector3(-0.35, 0.95, 0.2).applyEuler(this.physics.rotation);
      this.camera.position.copy(carPos).add(cabinOffset);

      const forwardTarget = carPos.clone().add(new THREE.Vector3(Math.sin(heading) * 30, 0.9, Math.cos(heading) * 30));
      this.camera.lookAt(forwardTarget);
    } else if (this.cameraMode === 'hood') {
      // Nose bumper cam for extreme speed sensation
      const hoodOffset = new THREE.Vector3(0, 0.55, 2.1).applyEuler(this.physics.rotation);
      this.camera.position.copy(carPos).add(hoodOffset);

      const forwardTarget = carPos.clone().add(new THREE.Vector3(Math.sin(heading) * 35, 0.3, Math.cos(heading) * 35));
      this.camera.lookAt(forwardTarget);
    } else if (this.cameraMode === 'drone') {
      // Free orbit drone camera
      this.droneAngle += delta * 0.4;
      const droneDist = 8.5;
      const dX = carPos.x + Math.sin(this.droneAngle) * droneDist;
      const dZ = carPos.z + Math.cos(this.droneAngle) * droneDist;
      this.camera.position.set(dX, carPos.y + 3.2, dZ);
      this.camera.lookAt(carPos.clone().add(new THREE.Vector3(0, 0.8, 0)));
    }
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
