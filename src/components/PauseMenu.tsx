/**
 * In-Game Pause Menu
 * Game Craft compliant: Modal overlay with Resume (Esc / Start),
 * Restart, Controls Reference, and Exit to Title.
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Gamepad2, Keyboard } from 'lucide-react';
import { soundEngine } from '../game/sound/soundEngine';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToTitle: () => void;
  isGamepadActive: boolean;
  gamepadName: string;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onExitToTitle,
  isGamepadActive,
  gamepadName,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundEngine.getIsMuted());

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 pointer-events-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl flex flex-col items-center">
        {/* Title */}
        <span className="text-xs uppercase font-speed tracking-widest text-cyan-400 font-bold mb-1">
          SHUTO C1 · TOKYO HORIZON
        </span>
        <h2 className="font-speed text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-6">
          GAME PAUSED
        </h2>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-md mb-8">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-speed text-lg font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME (ESC / START)</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-ui text-base font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RACE / RESET POSITION (R)</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-ui text-base font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            onClick={onExitToTitle}
            className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-ui text-base font-bold text-slate-400 hover:text-red-400 bg-slate-950 hover:bg-slate-900 border border-slate-800 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>EXIT TO GARAGE</span>
          </button>
        </div>

        {/* Controls Quick Reference Card */}
        <div className="w-full bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-left">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Keyboard className="w-4 h-4" />
              <span>KEYBOARD</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Gamepad2 className="w-4 h-4" />
              <span>{isGamepadActive ? gamepadName : 'BLUETOOTH / ANDROID TV'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-ui">
            <div className="text-slate-400">
              <span className="text-white font-mono font-bold">W / S</span> or <span className="text-white font-mono font-bold">Up/Down</span>
            </div>
            <div className="text-slate-300">
              <span className="text-emerald-400 font-bold">RT / LT</span> Gas & Brake
            </div>

            <div className="text-slate-400">
              <span className="text-white font-mono font-bold">A / D</span> or <span className="text-white font-mono font-bold">Left/Right</span>
            </div>
            <div className="text-slate-300">
              <span className="text-emerald-400 font-bold">Left Stick / D-Pad</span> Steering
            </div>

            <div className="text-slate-400">
              <span className="text-white font-mono font-bold">Space</span> Handbrake
            </div>
            <div className="text-slate-300">
              <span className="text-emerald-400 font-bold">(A) Button</span> Handbrake Drift
            </div>

            <div className="text-slate-400">
              <span className="text-white font-mono font-bold">Shift</span> Nitro Boost
            </div>
            <div className="text-slate-300">
              <span className="text-emerald-400 font-bold">(B) / RB</span> Nitro Boost
            </div>

            <div className="text-slate-400">
              <span className="text-white font-mono font-bold">C</span> Change Camera
            </div>
            <div className="text-slate-300">
              <span className="text-emerald-400 font-bold">(Y) Button</span> Change Camera
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
