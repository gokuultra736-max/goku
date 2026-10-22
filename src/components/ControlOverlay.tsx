/**
 * Collapsible Bottom Control Dock
 * Follows Three.js Skill Ergonomic Layout Guidelines:
 * - Centered at bottom (bottom: 20px, left: 50%, -translateX(50%))
 * - Zero viewport occlusion across center, left, and right flanks
 * - Collapsible "Cinema / Zen Mode" drawer
 * - Android Smart TV Bluetooth gamepad test and mapping
 */

import React, { useState } from 'react';
import { CameraView, WeatherType } from '../types';
import { SUPERCAR_SPECS } from '../game/cars/carModels';
import { soundEngine } from '../game/sound/soundEngine';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CloudRain,
  Car,
  Camera,
  Radio,
  Gamepad,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';

interface ControlOverlayProps {
  selectedCarId: string;
  onSelectCar: (carId: string) => void;
  currentWeather: WeatherType;
  onSelectWeather: (weather: WeatherType) => void;
  timeOfDay: number;
  onSetTimeOfDay: (hour: number) => void;
  cameraView: CameraView;
  onSelectCamera: (view: CameraView) => void;
  onResetCar: () => void;
  isGamepadActive: boolean;
  gamepadName: string;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  selectedCarId,
  onSelectCar,
  currentWeather,
  onSelectWeather,
  timeOfDay,
  onSetTimeOfDay,
  cameraView,
  onSelectCamera,
  onResetCar,
  isGamepadActive,
  gamepadName,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'time' | 'car' | 'camera' | 'radio' | 'controller'>('time');
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [currentRadio, setCurrentRadio] = useState(soundEngine.getRadioStation());

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectRadio = (station: 'eurobeat' | 'synthwave' | 'rainy_lofi' | 'off') => {
    soundEngine.setRadioStation(station);
    setCurrentRadio(station);
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 transition-transform duration-300 w-[95vw] max-w-[920px] pointer-events-auto ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Toggle Tab */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 border-t border-x border-slate-700/80 rounded-t-xl text-xs font-ui font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-lg"
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-cyan-400" />}
          <span>{isCollapsed ? 'Show Controls (H)' : 'Cinema Mode / Hide (H)'}</span>
        </button>
      </div>

      {/* Main Bottom Control Glassmorphic Container */}
      <div className="bg-slate-950/95 border border-slate-800/90 rounded-2xl p-3 md:p-4 shadow-2xl">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('time')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'time'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time & Weather</span>
            </button>

            <button
              onClick={() => setActiveTab('car')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'car'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Supercars</span>
            </button>

            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>

            <button
              onClick={() => setActiveTab('radio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'radio'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Tokyo Radio</span>
            </button>

            <button
              onClick={() => setActiveTab('controller')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-ui font-bold uppercase transition-colors cursor-pointer ${
                activeTab === 'controller'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Gamepad className="w-3.5 h-3.5" />
              <span>Android TV / Gamepad</span>
            </button>
          </div>

          {/* Quick Utility Actions: Reset Car & Mute */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onResetCar}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
              title="Reset Car on Track (R / Select)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleMute}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-red-950/60 border-red-500/40 text-red-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: TIME OF DAY & WEATHER PRESETS                     */}
        {/* ========================================================= */}
        {activeTab === 'time' && (
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* 24-Hour Slider */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between text-xs text-slate-300 font-ui mb-1.5">
                <span className="font-semibold text-cyan-300">Dynamic 24h Day-Night Clock:</span>
                <span className="font-speed font-bold text-white tabular-nums">
                  {Math.floor(timeOfDay)}:{String(Math.floor((timeOfDay % 1) * 60)).padStart(2, '0')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="0.1"
                value={timeOfDay}
                onChange={(e) => onSetTimeOfDay(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            {/* Quick Weather Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onSelectWeather('night')}
                className={`px-3 py-1.5 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
                  currentWeather === 'night'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                🌙 Neon Night
              </button>

              <button
                onClick={() => onSelectWeather('rain')}
                className={`px-3 py-1.5 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
                  currentWeather === 'rain'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                🌧️ Wet Rain
              </button>

              <button
                onClick={() => onSelectWeather('sunset')}
                className={`px-3 py-1.5 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
                  currentWeather === 'sunset'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                🌇 Golden Hour
              </button>

              <button
                onClick={() => onSelectWeather('clear')}
                className={`px-3 py-1.5 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
                  currentWeather === 'clear'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                ☀️ Noon Sun
              </button>

              <button
                onClick={() => onSelectWeather('storm')}
                className={`px-3 py-1.5 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
                  currentWeather === 'storm'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                ⚡ Thunderstorm
              </button>

              <button
                onClick={() => onSelectWeather('fog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-ui font-semibold transition-all cursor-pointer ${
                  currentWeather === 'fog'
                    ? 'bg-slate-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                🌫️ Tokyo Fog
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: HYPERCAR SWITCHER                                 */}
        {/* ========================================================= */}
        {activeTab === 'car' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {SUPERCAR_SPECS.map((car) => (
              <button
                key={car.id}
                onClick={() => onSelectCar(car.id)}
                className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                  selectedCarId === car.id
                    ? 'bg-gradient-to-br from-cyan-950 to-blue-900 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="text-[10px] text-slate-400 font-ui uppercase font-semibold">
                  {car.brand}
                </div>
                <div className="font-speed text-xs font-bold text-white truncate">
                  {car.name}
                </div>
                <div className="text-[10px] text-cyan-400 font-ui font-medium mt-1">
                  {car.horsepower} HP · {car.topSpeedKmh} KM/H
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CAMERA VIEWS                                      */}
        {/* ========================================================= */}
        {activeTab === 'camera' && (
          <div className="flex items-center justify-center gap-3">
            {[
              { id: 'chase', label: 'Dynamic Chase Cam', desc: 'Third-person trailing with drift swing' },
              { id: 'cockpit', label: 'Driver Cockpit', desc: 'Interior cabin view through windshield' },
              { id: 'hood', label: 'Front Hood / Bumper', desc: 'Extreme low-slung road speed sensation' },
              { id: 'drone', label: '360° Drone Orbit', desc: 'Cinematic orbiting spectator camera' },
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => onSelectCamera(cam.id as CameraView)}
                className={`px-4 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                  cameraView === cam.id
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="font-ui text-xs font-bold">{cam.label}</div>
                <div className="text-[10px] text-slate-400 hidden sm:block">{cam.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PROCEDURAL TOKYO RADIO                           */}
        {/* ========================================================= */}
        {activeTab === 'radio' && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { id: 'eurobeat', name: 'Tokyo Eurobeat 130 BPM', sub: 'High energy Shuto midnight battle' },
              { id: 'synthwave', name: 'Neo Tokyo Synthwave', sub: 'Atmospheric neon highway cruise' },
              { id: 'rainy_lofi', name: 'Shinjuku Rain Lo-Fi', sub: 'Chill electric piano chords' },
              { id: 'off', name: 'Radio Mute', sub: 'Pure mechanical engine sound only' },
            ].map((station) => (
              <button
                key={station.id}
                onClick={() => handleSelectRadio(station.id as any)}
                className={`px-4 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                  currentRadio === station.id
                    ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="font-ui text-xs font-bold">{station.name}</div>
                <div className="text-[10px] text-slate-400 hidden sm:block">{station.sub}</div>
              </button>
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ANDROID SMART TV & BLUETOOTH CONTROLLER GUIDE     */}
        {/* ========================================================= */}
        {activeTab === 'controller' && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Gamepad className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-ui font-bold text-white flex items-center gap-2">
                  <span>Bluetooth Controller Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isGamepadActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {isGamepadActive ? 'CONNECTED' : 'STANDBY / REMOTE'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {gamepadName || 'Connect any Bluetooth controller (Xbox, PS5/PS4, 8BitDo, Android TV Gamepad)'}
                </div>
              </div>
            </div>

            {/* Controller Button Mapping Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-ui text-slate-300">
              <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">RT / R2:</span> Gas (Throttle)
              </div>
              <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">LT / L2:</span> Foot Brake
              </div>
              <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">(A) Button:</span> Handbrake Drift
              </div>
              <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold">(B) / RB:</span> Nitro Boost
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
