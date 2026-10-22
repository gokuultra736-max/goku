/**
 * Realistic Supercar Vehicle Dynamics & Physics Engine
 * Handles engine torque curves, 7/8-speed transmission, drift slip-angle kinematics,
 * aerodynamic downforce, nitro boost, weight transfer, and collision resolution.
 */

import * as THREE from 'three';
import { CarSpec, VehicleTelemetry } from '../../types';
import { InputState } from '../input/gamepadManager';
import { soundEngine } from '../sound/soundEngine';

export class VehiclePhysics {
  public position: THREE.Vector3 = new THREE.Vector3(0, 6.6, -420);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  public headingAngle: number = 0; // rotation around Y in radians

  // Vehicle dynamics state
  public speedKmh: number = 0;
  public rpm: number = 900;
  public currentGear: number = 1;
  public isReverse: boolean = false;
  public steerAngle: number = 0; // in radians
  public nitroAmount: number = 100; // 0 to 100
  public boostPsi: number = 0;

  // Drift state
  public slipAngle: number = 0;
  public isDrifting: boolean = false;
  public driftScoreTotal: number = 0;
  public currentDriftPoints: number = 0;
  public driftMultiplier: number = 1.0;
  public driftDuration: number = 0;
  private driftEndTimer: number = 0;

  // Weight transfer pitch & roll
  public pitchAngle: number = 0; // squat / dive
  public rollAngle: number = 0;  // cornering lean
  public lateralG: number = 0;

  // Car specification
  public spec: CarSpec;

  // Collision reference
  private carBoundingRadius: number = 2.2;
  private collisionCooldown: number = 0;

  // Reusable vectors to avoid GC in animation loop
  private forwardVec: THREE.Vector3 = new THREE.Vector3();
  private rightVec: THREE.Vector3 = new THREE.Vector3();

  constructor(spec: CarSpec, startPos?: THREE.Vector3) {
    this.spec = spec;
    if (startPos) {
      this.position.copy(startPos);
    }
  }

  public setSpec(spec: CarSpec) {
    this.spec = spec;
    this.currentGear = 1;
    this.rpm = 900;
  }

  public resetPosition(pos?: THREE.Vector3, heading: number = 0) {
    this.position.copy(pos || new THREE.Vector3(0, 6.6, -420));
    this.velocity.set(0, 0, 0);
    this.speedKmh = 0;
    this.headingAngle = heading;
    this.rotation.set(0, heading, 0);
    this.currentGear = 1;
    this.isReverse = false;
    this.rpm = 900;
    this.nitroAmount = 100;
    this.currentDriftPoints = 0;
  }

  public update(
    delta: number,
    input: InputState,
    collisionBoxes: THREE.Box3[],
    roadWetness: number = 0.0
  ): {
    telemetry: VehicleTelemetry;
    exhaustBackfire: boolean;
    tireSmoke: boolean;
    waterSpray: boolean;
    hitImpulse: boolean;
  } {
    // Clamp frame delta for stability
    const dt = Math.min(delta, 0.05);

    let exhaustBackfire = false;
    let tireSmoke = false;
    let waterSpray = false;
    let hitImpulse = false;

    // 1. Calculate orientation vectors
    this.forwardVec.set(Math.sin(this.headingAngle), 0, Math.cos(this.headingAngle)).normalize();
    this.rightVec.set(Math.cos(this.headingAngle), 0, -Math.sin(this.headingAngle)).normalize();

    // 2. Speed-sensitive steering assist
    const maxSteerLimit = Math.max(0.12, 0.58 - (this.speedKmh / 350) * 0.42);
    const targetSteer = input.steer * maxSteerLimit;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer, 14, dt);

    // 3. Nitro Boost Logic
    let isNitroFiring = false;
    if (input.nitro && this.nitroAmount > 0 && input.throttle > 0.2) {
      isNitroFiring = true;
      this.nitroAmount = Math.max(0, this.nitroAmount - dt * 24);
      if (Math.random() < 0.15) exhaustBackfire = true;
    } else {
      // Regenerate nitro slowly during clean driving or drifting
      this.nitroAmount = Math.min(100, this.nitroAmount + dt * 4.0);
    }

    // 4. Transmission & Engine RPM Calculation
    const maxRpm = this.spec.engineSoundType === 'flat6' ? 9200 : 8200;
    const idleRpm = 950;
    const speedRatio = (this.speedKmh / this.spec.topSpeedKmh);
    const numGears = this.spec.gearRatios.length;

    // Automatic transmission logic
    if (this.speedKmh < 1.0 && input.brake > 0.5 && !this.isReverse) {
      this.isReverse = true;
    } else if (this.isReverse && input.throttle > 0.5) {
      this.isReverse = false;
      this.currentGear = 1;
    }

    if (!this.isReverse) {
      const gearFraction = 1 / numGears;
      const targetGear = Math.min(numGears, Math.max(1, Math.floor(speedRatio / gearFraction) + 1));
      if (targetGear !== this.currentGear) {
        if (targetGear < this.currentGear) {
          exhaustBackfire = true;
          soundEngine.triggerExhaustPop();
        }
        this.currentGear = targetGear;
      }

      // Calculate RPM from current gear and vehicle speed
      const gearRatio = this.spec.gearRatios[this.currentGear - 1] || 1.0;
      const calculatedRpm = idleRpm + (this.speedKmh * 24 * gearRatio);
      this.rpm = THREE.MathUtils.damp(this.rpm, Math.min(calculatedRpm, maxRpm), 18, dt);
    } else {
      this.rpm = idleRpm + input.brake * 3500;
    }

    // Turbo boost PSI build-up
    const targetPsi = input.throttle * (isNitroFiring ? 26 : 19.5);
    this.boostPsi = THREE.MathUtils.damp(this.boostPsi, targetPsi, 8, dt);

    // 5. Longitudinal Acceleration & Braking Forces
    const hpFactor = (this.spec.horsepower / 600);
    const nitroMultiplier = isNitroFiring ? 1.6 : 1.0;
    let accelerationForce = 0;

    if (!this.isReverse) {
      if (input.throttle > 0) {
        // Torque diminishes slightly at high speeds due to aerodynamic drag
        const aeroDragFactor = Math.max(0.15, 1.0 - Math.pow(this.speedKmh / this.spec.topSpeedKmh, 2.4));
        accelerationForce = input.throttle * (22.0 * hpFactor * nitroMultiplier) * aeroDragFactor;
      }
      if (input.brake > 0) {
        // High-performance carbon ceramic brakes
        accelerationForce -= input.brake * 38.0;
      }
    } else {
      if (input.brake > 0) {
        accelerationForce = -input.brake * 12.0; // Reverse throttle
      }
      if (input.throttle > 0) {
        accelerationForce = input.throttle * 32.0; // Brake from reverse
      }
    }

    // Handbrake drag & lockup
    if (input.handbrake) {
      accelerationForce -= 18.0;
    }

    // Natural rolling resistance and aerodynamic drag
    const aeroDrag = 0.0006 * Math.pow(this.speedKmh, 2);
    const rollingResistance = 1.2;
    const totalResistance = rollingResistance + aeroDrag;

    // Apply acceleration along heading
    const forwardSpeed = this.velocity.dot(this.forwardVec);
    const newForwardSpeed = forwardSpeed + (accelerationForce - totalResistance * Math.sign(forwardSpeed)) * dt;

    // 6. Drift Kinematics & Lateral Friction Model
    const lateralSpeed = this.velocity.dot(this.rightVec);

    // Calculate slip angle in radians
    const actualHeading = Math.atan2(this.velocity.x, this.velocity.z);
    let rawSlip = actualHeading - this.headingAngle;
    while (rawSlip > Math.PI) rawSlip -= Math.PI * 2;
    while (rawSlip < -Math.PI) rawSlip += Math.PI * 2;
    this.slipAngle = this.speedKmh > 15 ? rawSlip : 0;

    // Wet road reduces lateral grip for authentic CarX Street slide feel
    const baseGrip = this.spec.drivetrain === 'AWD' ? 0.92 : 0.82;
    const wetGripModifier = 1.0 - roadWetness * 0.45;
    const effectiveGrip = (input.handbrake ? 0.22 : baseGrip) * wetGripModifier;

    // Counter-steering and drift rotation
    let yawRate = this.steerAngle * (this.speedKmh / 35);
    if (input.handbrake && this.speedKmh > 25) {
      yawRate *= 1.8; // whip the tail out
    }
    this.headingAngle += yawRate * dt;
    this.rotation.y = this.headingAngle;

    // Lateral friction restitution
    const lateralDamping = Math.min(1.0, (14.0 * effectiveGrip) * dt);
    const adjustedLateralSpeed = lateralSpeed * (1.0 - lateralDamping);

    // Reconstruct velocity
    this.velocity.copy(this.forwardVec).multiplyScalar(newForwardSpeed)
      .add(this.rightVec.clone().multiplyScalar(adjustedLateralSpeed));

    // Update Speed in KM/H
    this.speedKmh = Math.max(0, this.velocity.length() * 3.6);

    // Limit top speed
    if (this.speedKmh > this.spec.topSpeedKmh * (isNitroFiring ? 1.08 : 1.0)) {
      this.velocity.multiplyScalar((this.spec.topSpeedKmh / this.speedKmh));
      this.speedKmh = this.spec.topSpeedKmh;
    }

    // 7. Drift Scoring System
    const isSlipping = Math.abs(this.slipAngle) > 0.18 && this.speedKmh > 35;
    if (isSlipping) {
      this.isDrifting = true;
      this.driftDuration += dt;
      this.driftEndTimer = 0;

      // Points scale with slip angle (higher angle = higher reward) and speed
      const angleMultiplier = Math.min(3.0, Math.abs(this.slipAngle) * 3.5);
      const pointsDelta = Math.floor(this.speedKmh * angleMultiplier * 1.8 * dt * 10);
      this.currentDriftPoints += pointsDelta;

      // Increase combo multiplier
      if (this.driftDuration > 1.2 && this.driftMultiplier < 2.0) this.driftMultiplier = 2.0;
      if (this.driftDuration > 2.8 && this.driftMultiplier < 3.0) this.driftMultiplier = 3.0;
      if (this.driftDuration > 4.5 && this.driftMultiplier < 5.0) this.driftMultiplier = 5.0;

      tireSmoke = roadWetness < 0.4;
      waterSpray = roadWetness >= 0.4;
    } else {
      if (this.isDrifting) {
        this.driftEndTimer += dt;
        if (this.driftEndTimer > 0.8) {
          // Bank drift score
          this.driftScoreTotal += Math.floor(this.currentDriftPoints * this.driftMultiplier);
          this.currentDriftPoints = 0;
          this.driftMultiplier = 1.0;
          this.driftDuration = 0;
          this.isDrifting = false;
        }
      }
    }

    // 8. Weight Transfer Suspension (Pitch & Roll)
    const accelG = (accelerationForce / 9.8);
    const targetPitch = THREE.MathUtils.clamp(accelG * -0.04, -0.06, 0.05);
    this.pitchAngle = THREE.MathUtils.damp(this.pitchAngle, targetPitch, 12, dt);

    this.lateralG = (lateralSpeed * yawRate) / 9.8;
    const targetRoll = THREE.MathUtils.clamp(-this.lateralG * 0.035, -0.07, 0.07);
    this.rollAngle = THREE.MathUtils.damp(this.rollAngle, targetRoll, 12, dt);

    this.rotation.x = this.pitchAngle;
    this.rotation.z = this.rollAngle;

    // 9. Update Position & Check Elevation Ramps
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    // Dynamic track elevation support (Viaduct at Y=6.6 vs Ground level at Y=0.6)
    // Ramps are at Z in range [280, 400] and [-400, -280]
    let targetGroundY = 6.6; // default on elevated expressway
    const isGroundAvenue = (this.position.x < -20 || this.position.x > 30 || Math.abs(this.position.z) < 180 && Math.abs(this.position.x) > 14);

    if (isGroundAvenue) {
      targetGroundY = 0.6; // ground level street
    } else {
      targetGroundY = 6.6; // elevated highway
    }

    // Smoothly follow terrain elevation
    this.position.y = THREE.MathUtils.damp(this.position.y, targetGroundY, 8, dt);

    // 10. Collision Detection & Wall Bounce
    this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);

    // Guardrail barriers on highway
    if (this.position.y > 4.5) {
      const highwayHalfWidth = 11.2;
      if (Math.abs(this.position.x) > highwayHalfWidth) {
        this.position.x = Math.sign(this.position.x) * highwayHalfWidth;
        this.velocity.x *= -0.4; // bounce off barrier
        this.velocity.z *= 0.85; // friction scrape
        hitImpulse = true;
        if (this.collisionCooldown <= 0) {
          soundEngine.triggerCrash();
          this.collisionCooldown = 0.25;
        }
      }
    }

    // Building collision boxes
    const carBox = new THREE.Box3();
    carBox.setFromCenterAndSize(
      this.position,
      new THREE.Vector3(this.carBoundingRadius, 1.5, this.carBoundingRadius * 1.8)
    );

    for (const bBox of collisionBoxes) {
      if (carBox.intersectsBox(bBox)) {
        hitImpulse = true;
        // Rebound car
        const collisionNormal = this.position.clone().sub(bBox.getCenter(new THREE.Vector3())).normalize();
        this.velocity.reflect(collisionNormal).multiplyScalar(0.45);
        this.position.add(collisionNormal.multiplyScalar(0.4));
        if (this.collisionCooldown <= 0) {
          soundEngine.triggerCrash();
          this.collisionCooldown = 0.3;
        }
        break;
      }
    }

    // Construct telemetry packet
    const telemetry: VehicleTelemetry = {
      speedKmh: Math.round(this.speedKmh),
      rpm: Math.round(this.rpm),
      gear: this.isReverse ? 'R' : this.currentGear,
      nitro: Math.round(this.nitroAmount),
      boostPsi: Number(this.boostPsi.toFixed(1)),
      driftAngle: Math.round(THREE.MathUtils.radToDeg(this.slipAngle)),
      isDrifting: this.isDrifting,
      driftScore: this.driftScoreTotal,
      driftMultiplier: this.driftMultiplier,
      currentDriftPoints: this.currentDriftPoints,
      gForceLateral: Number(this.lateralG.toFixed(2)),
      lapTime: 0,
      currentLap: 1,
      totalLaps: 3,
      racePosition: 1,
      totalRacers: 4,
      speedTrapFlash: null,
    };

    return {
      telemetry,
      exhaustBackfire,
      tireSmoke,
      waterSpray,
      hitImpulse,
    };
  }
}
