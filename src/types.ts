/**
 * Types & Data Definitions for Tokyo Horizon: Shuto Express
 */

export type WeatherType = 'clear' | 'sunset' | 'night' | 'rain' | 'storm' | 'fog';

export type CameraView = 'chase' | 'cockpit' | 'hood' | 'drone';

export type GameMode = 'freeroam' | 'sprint' | 'drift';

export interface CarSpec {
  id: string;
  name: string;
  brand: string;
  tagline: string;
  category: 'Hypercar' | 'JDM Legend' | 'Track Special' | 'Speed Record';
  horsepower: number;
  topSpeedKmh: number;
  accel0to100: number; // in seconds
  weightKg: number;
  drivetrain: 'AWD' | 'RWD';
  gearRatios: number[];
  color: string;
  accentColor: string;
  engineSoundType: 'w16' | 'rb26' | 'flat6' | 'v8twin' | 'v12';
}

export interface VehicleTelemetry {
  speedKmh: number;
  rpm: number;
  gear: number | string; // 1-7 or 'R' or 'N'
  nitro: number; // 0 to 100
  boostPsi: number;
  driftAngle: number;
  isDrifting: boolean;
  driftScore: number;
  driftMultiplier: number;
  currentDriftPoints: number;
  gForceLateral: number;
  lapTime: number;
  currentLap: number;
  totalLaps: number;
  racePosition: number;
  totalRacers: number;
  speedTrapFlash: { speed: number; record: boolean; timestamp: number } | null;
}

export interface WeatherPresetConfig {
  name: string;
  skyColorTop: string;
  skyColorBottom: string;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  fogColor: string;
  fogDensity: number;
  isRaining: boolean;
  roadWetness: number; // 0 to 1
  roughnessModifier: number;
}
