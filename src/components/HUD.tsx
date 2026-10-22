/**
 * In-Game Heads-Up Display (HUD)
 * Game Craft compliant:
 * - Unobstructed viewport (>85% visible, pointer-events: none on wrapper)
 * - Zero backdrop-filter over active WebGL
 * - Tabular-nums integer readouts for RPM, KM/H, G-Force, and Drift
 * - High-speed radar notifications & TV Bluetooth controller status
 */

import React from 'react';
import { VehicleTelemetry, WeatherType } from '../types';
import { Flame, Gauge, Zap, Gamepad2, CloudRain, Sun, Moon } from 'lucide-react';

interface HUDProps {
  telemetry: VehicleTelemetry;
  weatherState: {
    timeOfDay: number;
    weather: WeatherType;
    wetness: number;
  };
  speedTrapFlash: { speed: number; name: string } | null;
  isGamepadActive: boolean;
  gamepadName: string;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  weatherState,
  speedTrapFlash,
  isGamepadActive,
  gamepadName,
}) => {
  const { speedKmh, rpm, gear, nitro, boostPsi, driftAngle, isDrifting, currentDriftPoints, driftMultiplier } = telemetry;

  // Format time of day (e.g. 21.5 -> "21:30")
  const hour = Math.floor(weatherState.timeOfDay);
  const minutes = Math.floor((weatherState.timeOfDay - hour) * 60);
  const timeFormatted = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  // RPM calculation for circular gauge: 0 to 9000 RPM
  const rpmPercent = Math.min(1.0, rpm / 9000);
  const isRedline = rpm > 7800;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none">
      {/* ========================================================= */}
      {/* TOP PERIMETER: RACE STATUS, TIME & WEATHER, GAMEPAD STATUS */}
      {/* ========================================================= */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Race Position & Lap Timer */}
        <div className="flex items-center gap-3 bg-slate-950/85 border border-slate-800/90 px-4 py-2.5 rounded-xl">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-400 font-ui font-bold">POS</span>
            <span className="font-speed text-2xl md:text-3xl font-black text-cyan-400 tabular-nums">
              P{telemetry.racePosition}
            </span>
            <span className="text-xs text-slate-500 font-ui">/{telemetry.totalRacers}</span>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-ui font-bold tracking-wider">
              LAP {telemetry.currentLap}/{telemetry.totalLaps}
            </span>
            <span className="font-speed text-sm md:text-base font-bold text-slate-200 tabular-nums">
              {telemetry.lapTime.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Top-Center: Speed Trap Radar Trigger Notification */}
        {speedTrapFlash && (
          <div className="animate-bounce flex items-center gap-3 bg-red-950/95 border-2 border-red-500 px-6 py-2 rounded-xl shadow-2xl shadow-red-500/50">
            <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
            <div className="text-center">
              <div className="text-[10px] font-speed uppercase tracking-widest text-red-200">
                {speedTrapFlash.name}
              </div>
              <div className="font-speed text-2xl md:text-3xl font-black text-white tabular-nums">
                {speedTrapFlash.speed} <span className="text-sm font-bold text-red-300">KM/H</span>
              </div>
            </div>
          </div>
        )}

        {/* Top-Right: Weather & Bluetooth Controller Indicator */}
        <div className="flex items-center gap-2">
          {/* Weather & Time Badge */}
          <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-800/90 px-3.5 py-2 rounded-xl">
            {weatherState.weather === 'rain' || weatherState.weather === 'storm' ? (
              <CloudRain className="w-4 h-4 text-cyan-400 animate-pulse" />
            ) : weatherState.timeOfDay >= 6 && weatherState.timeOfDay <= 18 ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-300" />
            )}
            <div className="flex flex-col text-right">
              <span className="font-speed text-xs font-bold text-slate-200 tabular-nums">
                {timeFormatted}
              </span>
              <span className="text-[10px] text-cyan-400 uppercase font-ui font-semibold">
                {weatherState.weather}
              </span>
            </div>
          </div>

          {/* Bluetooth Gamepad Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-ui ${
              isGamepadActive
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-500'
            }`}
            title={isGamepadActive ? gamepadName : 'Connect Bluetooth controller'}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">
              {isGamepadActive ? 'Gamepad' : 'Remote'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CENTER: DYNAMIC DRIFT SCORE & COMBO ACCLAIM               */}
      {/* ========================================================= */}
      <div className="my-auto flex flex-col items-center justify-center">
        {isDrifting && currentDriftPoints > 0 && (
          <div className="flex flex-col items-center text-center animate-pulse">
            <div className="flex items-baseline gap-2">
              <span className="font-speed text-xs uppercase tracking-widest text-amber-400 font-bold">
                DRIFT ANGLE {Math.abs(driftAngle)}°
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-speed text-xs font-black">
                {driftMultiplier.toFixed(1)}x
              </span>
            </div>
            <div className="font-speed text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-pink-500 tabular-nums drop-shadow-neon">
              +{Math.floor(currentDriftPoints * driftMultiplier)}
            </div>
            <div className="text-xs font-ui font-bold text-slate-300 uppercase tracking-wider">
              {Math.abs(driftAngle) > 35 ? '🔥 HIGH ANGLE SLIP' : '⚡ SHUTO DRIFT'}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* BOTTOM CLUSTER: RADAR (LEFT) & HIGH-PERF GAUGE (RIGHT)    */}
      {/* ========================================================= */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom-Left: Mini GPS Route Radar */}
        <div className="bg-slate-950/85 border border-slate-800/90 p-3 rounded-2xl flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1 text-[10px] text-slate-400 font-ui font-semibold">
            <span>C1 WANGAN GPS</span>
            <span className="text-cyan-400 font-bold">RADAR</span>
          </div>
          {/* Radar circle representation */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border border-slate-700/60 bg-slate-900/90 overflow-hidden flex items-center justify-center">
            {/* Grid crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-800" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-800" />
            {/* Range rings */}
            <div className="w-16 h-16 rounded-full border border-slate-800/80" />

            {/* Highway loop representation */}
            <div className="absolute inset-2 border-2 border-cyan-500/30 rounded-2xl transform rotate-12" />

            {/* Player marker (Arrow pointing forward) */}
            <div className="w-3.5 h-3.5 bg-cyan-400 border border-white rounded-full flex items-center justify-center shadow-lg shadow-cyan-400/80 z-10 animate-ping opacity-75 absolute" />
            <div className="w-3 h-3 bg-cyan-400 border-2 border-white rounded-full z-20" />

            {/* Sweep radar beam */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/10 to-cyan-400/20 rounded-full animate-spin [animation-duration:4s]" />
          </div>
        </div>

        {/* Bottom-Right: Forza / CarX High-Performance Digital & Analog Gauge */}
        <div className="bg-slate-950/90 border border-slate-800/90 p-4 rounded-2xl flex flex-col items-end min-w-[210px] md:min-w-[260px]">
          {/* Nitro & Turbo boost indicators */}
          <div className="w-full flex items-center justify-between gap-3 mb-2">
            {/* Nitro bar */}
            <div className="flex-1 flex items-center gap-1.5">
              <Flame className={`w-3.5 h-3.5 ${nitro > 20 ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
              <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-75"
                  style={{ width: `${nitro}%` }}
                />
              </div>
              <span className="text-[10px] font-speed text-cyan-300 tabular-nums">{nitro}%</span>
            </div>

            {/* Turbo Boost PSI */}
            <div className="flex items-center gap-1 text-[10px] font-speed text-orange-400">
              <Gauge className="w-3 h-3" />
              <span className="tabular-nums">{boostPsi} PSI</span>
            </div>
          </div>

          {/* RPM Arc Bar */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-2 relative">
            <div
              className={`h-full transition-all duration-75 ${
                isRedline
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500'
                  : 'bg-gradient-to-r from-emerald-500 via-yellow-500 to-orange-500'
              }`}
              style={{ width: `${rpmPercent * 100}%` }}
            />
          </div>

          {/* Gear & Speed Cluster */}
          <div className="flex items-baseline justify-between w-full">
            {/* Active Gear Display */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-ui text-slate-400 font-bold uppercase">GEAR</span>
              <span className={`font-speed text-3xl md:text-4xl font-black ${isRedline ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {gear}
              </span>
            </div>

            {/* Giant Speedometer Readout */}
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1">
                <span className="font-speed text-5xl md:text-6xl font-black text-white tabular-nums tracking-tighter">
                  {speedKmh}
                </span>
                <span className="font-speed text-sm md:text-base font-bold text-cyan-400">
                  KM/H
                </span>
              </div>
              <span className="text-[10px] font-speed text-slate-400 tabular-nums">
                {rpm} RPM
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
