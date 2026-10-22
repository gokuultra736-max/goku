/**
 * Title Screen & Supercar Garage Selector
 * Game Craft compliant: Bespoke inline SVG title lockup, 30-40% negative space,
 * primary Start CTA (Enter / Space / Gamepad (A)), and Android Smart TV controller hints.
 */

import React, { useEffect, useState } from 'react';
import { SUPERCAR_SPECS } from '../game/cars/carModels';
import { GameMode } from '../types';
import { Gamepad, Play, Zap, Gauge, Flame, Compass, Tv } from 'lucide-react';

interface TitleScreenProps {
  selectedCarId: string;
  onSelectCar: (carId: string) => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  gamepadName: string;
  isGamepadActive: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedCarId,
  onSelectCar,
  selectedMode,
  onSelectMode,
  onStartGame,
  gamepadName,
  isGamepadActive,
}) => {
  const currentSpec = SUPERCAR_SPECS.find((c) => c.id === selectedCarId) || SUPERCAR_SPECS[0];
  const [activeCarIndex, setActiveCarIndex] = useState(
    Math.max(0, SUPERCAR_SPECS.findIndex((c) => c.id === selectedCarId))
  );

  // Keyboard and Gamepad listeners for menu navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setActiveCarIndex((prev) => {
          const next = (prev - 1 + SUPERCAR_SPECS.length) % SUPERCAR_SPECS.length;
          onSelectCar(SUPERCAR_SPECS[next].id);
          return next;
        });
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setActiveCarIndex((prev) => {
          const next = (prev + 1) % SUPERCAR_SPECS.length;
          onSelectCar(SUPERCAR_SPECS[next].id);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, onSelectCar]);

  const selectCarByIndex = (idx: number) => {
    setActiveCarIndex(idx);
    onSelectCar(SUPERCAR_SPECS[idx].id);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-6 md:p-12 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/80 pointer-events-auto overflow-y-auto">
      {/* Top Header: Bespoke Inline SVG Title Lockup */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          {/* Bespoke Title Lockup */}
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10 text-cyan-400 drop-shadow-neon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
              <circle cx="6.5" cy="16.5" r="2.5"/>
              <circle cx="16.5" cy="16.5" r="2.5"/>
            </svg>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-speed font-black tracking-widest text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-pink-500">
                  TOKYO HORIZON
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                  首都高 C1
                </span>
              </div>
              <p className="text-xs tracking-wider text-slate-400 uppercase font-ui mt-0.5">
                Shuto Expressway · Open World Exploration & Drift · 60 FPS
              </p>
            </div>
          </div>
        </div>

        {/* Controller Status Indicator (Android TV & Bluetooth) */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-4 py-2 rounded-lg">
          <Gamepad className={`w-5 h-5 ${isGamepadActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <div className="text-left text-xs">
            <div className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Android TV / Bluetooth Controller</span>
            </div>
            <div className="font-semibold text-slate-200 truncate max-w-[200px]">
              {isGamepadActive ? gamepadName || 'Controller Active (A to Start)' : 'Keyboard or Gamepad Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Center Hero: Supercar Showcase & Stat Radar */}
      <div className="my-auto py-6 flex flex-col items-center max-w-5xl mx-auto w-full">
        {/* Car Name & Tagline */}
        <div className="text-center mb-6">
          <span className="text-xs tracking-widest uppercase text-pink-400 font-bold px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/30">
            {currentSpec.brand} · {currentSpec.category}
          </span>
          <h1 className="font-speed text-4xl md:text-6xl font-black text-white mt-2 tracking-wide uppercase">
            {currentSpec.name}
          </h1>
          <p className="text-slate-300 text-sm md:text-base font-ui max-w-xl mx-auto mt-1">
            {currentSpec.tagline}
          </p>
        </div>

        {/* Car Selection Carousel Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 w-full max-w-3xl">
          {SUPERCAR_SPECS.map((car, idx) => (
            <button
              key={car.id}
              onClick={() => selectCarByIndex(idx)}
              className={`px-4 py-2.5 rounded-lg font-ui text-sm font-semibold transition-all cursor-pointer ${
                activeCarIndex === idx
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-300 scale-105'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <div className="text-xs opacity-75">{car.brand}</div>
              <div className="font-bold">{car.name}</div>
            </button>
          ))}
        </div>

        {/* Real Performance Specs Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-ui uppercase">Horsepower</div>
              <div className="font-speed text-2xl font-bold text-white tabular-nums">
                {currentSpec.horsepower} <span className="text-xs text-slate-400 font-normal">HP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-ui uppercase">Top Speed</div>
              <div className="font-speed text-2xl font-bold text-cyan-300 tabular-nums">
                {currentSpec.topSpeedKmh} <span className="text-xs text-slate-400 font-normal">KM/H</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-ui uppercase">0-100 km/h</div>
              <div className="font-speed text-2xl font-bold text-pink-300 tabular-nums">
                {currentSpec.accel0to100} <span className="text-xs text-slate-400 font-normal">SEC</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-ui uppercase">Drivetrain & Mass</div>
              <div className="font-speed text-2xl font-bold text-emerald-300 tabular-nums">
                {currentSpec.drivetrain} <span className="text-xs text-slate-400 font-normal">· {currentSpec.weightKg}kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode Selector */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => onSelectMode('freeroam')}
            className={`px-5 py-2 rounded-lg font-ui text-sm font-bold uppercase transition-all cursor-pointer ${
              selectedMode === 'freeroam'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Tokyo Free Roam
          </button>
          <button
            onClick={() => onSelectMode('sprint')}
            className={`px-5 py-2 rounded-lg font-ui text-sm font-bold uppercase transition-all cursor-pointer ${
              selectedMode === 'sprint'
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Shuto Midnight Sprint
          </button>
          <button
            onClick={() => onSelectMode('drift')}
            className={`px-5 py-2 rounded-lg font-ui text-sm font-bold uppercase transition-all cursor-pointer ${
              selectedMode === 'drift'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Daikoku Drift Meet
          </button>
        </div>

        {/* Primary Start CTA Button */}
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={onStartGame}
            className="group relative px-10 py-4 rounded-xl font-speed text-xl font-black uppercase tracking-wider text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-pink-500 hover:from-cyan-400 hover:via-blue-500 hover:to-pink-400 shadow-xl shadow-cyan-500/40 hover:shadow-cyan-400/60 transform hover:-translate-y-0.5 transition-all flex items-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
            <span>HIT THE SHUTO EXPRESSWAY</span>
          </button>
          <div className="text-xs text-slate-400 font-ui mt-2 flex items-center gap-2">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">ENTER</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-400">(A) BUTTON</kbd> on Bluetooth Gamepad</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Flat Single Control Hint Line (Game Craft Standard) */}
      <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-ui border-t border-slate-800/80 pt-4 gap-2">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <span className="text-slate-300 font-medium">Controls:</span>
          <span><kbd className="text-slate-200 font-mono">WASD / RT+LT</kbd> Gas & Brake</span>
          <span>·</span>
          <span><kbd className="text-slate-200 font-mono">Space / (A)</kbd> Handbrake Drift</span>
          <span>·</span>
          <span><kbd className="text-slate-200 font-mono">Shift / (B)</kbd> Nitro Boost</span>
          <span>·</span>
          <span><kbd className="text-slate-200 font-mono">C / (Y)</kbd> Change Camera</span>
          <span>·</span>
          <span><kbd className="text-slate-200 font-mono">R / Select</kbd> Reset Car</span>
          <span>·</span>
          <span><kbd className="text-slate-200 font-mono">Esc / Start</kbd> Pause</span>
        </div>
        <div className="text-slate-500">
          Smart TV Ready · Web Audio Synthesized · Tokyo Wangan C1
        </div>
      </div>
    </div>
  );
};
