/**
 * Tokyo Horizon: Shuto Express - Main Application Entry
 * Full-viewport Game Shell: Title Screen -> Playing -> Pause
 * Isolated WebGL container, zero-latency input polling, and Bluetooth Gamepad support.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { ControlOverlay } from './components/ControlOverlay';
import { PauseMenu } from './components/PauseMenu';
import { CameraView, GameMode, VehicleTelemetry, WeatherType } from './types';
import { inputManager } from './game/input/gamepadManager';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI state
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>('title');
  const [selectedCarId, setSelectedCarId] = useState<string>('bugatti-bolide');
  const [selectedMode, setSelectedMode] = useState<GameMode>('freeroam');

  // Environment and Camera state
  const [currentWeather, setCurrentWeather] = useState<WeatherType>('night');
  const [timeOfDay, setTimeOfDay] = useState<number>(21.5);
  const [cameraView, setCameraView] = useState<CameraView>('chase');

  // Bluetooth Gamepad state
  const [isGamepadActive, setIsGamepadActive] = useState<boolean>(false);
  const [gamepadName, setGamepadName] = useState<string>('');
  const [gamepadToast, setGamepadToast] = useState<string | null>(null);

  // Speed trap flash alert
  const [speedTrapFlash, setSpeedTrapFlash] = useState<{ speed: number; name: string } | null>(null);

  // Real-time telemetry state
  const [telemetry, setTelemetry] = useState<VehicleTelemetry>({
    speedKmh: 0,
    rpm: 950,
    gear: 1,
    nitro: 100,
    boostPsi: 0,
    driftAngle: 0,
    isDrifting: false,
    driftScore: 0,
    driftMultiplier: 1.0,
    currentDriftPoints: 0,
    gForceLateral: 0,
    lapTime: 0,
    currentLap: 1,
    totalLaps: 3,
    racePosition: 1,
    totalRacers: 4,
    speedTrapFlash: null,
  });

  const [weatherState, setWeatherState] = useState<{
    timeOfDay: number;
    weather: WeatherType;
    wetness: number;
  }>({
    timeOfDay: 21.5,
    weather: 'night',
    wetness: 0.35,
  });

  const [webglError, setWebglError] = useState<string | null>(null);

  // Initialize Three.js Game Engine once on mount in isolated ref
  const initEngine = useCallback(() => {
    if (!canvasMountRef.current) return;
    setWebglError(null);

    try {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }

      const engine = new GameEngine(canvasMountRef.current);
      engineRef.current = engine;

      engine.setCallbacks(
        (newTelemetry, newWeather) => {
          setTelemetry(newTelemetry);
          setWeatherState(newWeather);
          setTimeOfDay(newWeather.timeOfDay);
        },
        (speed, name) => {
          setSpeedTrapFlash({ speed, name });
          window.setTimeout(() => {
            setSpeedTrapFlash(null);
          }, 3000);
        }
      );

      // Gamepad connection notification
      inputManager.onGamepadConnected((name) => {
        setIsGamepadActive(true);
        setGamepadName(name);
        setGamepadToast(`Connected: ${name}`);
        window.setTimeout(() => setGamepadToast(null), 4000);
      });

      engine.start();
    } catch (err: unknown) {
      console.warn('WebGL Initialization issue:', err);
      const msg = err instanceof Error ? err.message : 'WebGL could not be created in current environment.';
      setWebglError(msg);
    }
  }, []);

  useEffect(() => {
    initEngine();
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [initEngine]);

  // Poll for active gamepad in loop
  useEffect(() => {
    const timer = window.setInterval(() => {
      const state = inputManager.poll();
      if (state.isGamepadActive !== isGamepadActive) {
        setIsGamepadActive(state.isGamepadActive);
        setGamepadName(state.gamepadName);
      }
      if (state.pause) {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      }
    }, 250);
    return () => clearInterval(timer);
  }, [isGamepadActive]);

  // Global key bindings for Pause and Cinema Mode
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing') {
          engineRef.current?.pause();
          setGameState('paused');
        } else if (gameState === 'paused') {
          engineRef.current?.resume();
          setGameState('playing');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  // Handle Car Selection
  const handleSelectCar = useCallback((carId: string) => {
    setSelectedCarId(carId);
    engineRef.current?.changeCar(carId);
  }, []);

  // Handle Weather change
  const handleSelectWeather = useCallback((weather: WeatherType) => {
    setCurrentWeather(weather);
    engineRef.current?.setWeather(weather);
  }, []);

  // Handle Time of Day slider
  const handleSetTimeOfDay = useCallback((hour: number) => {
    setTimeOfDay(hour);
    engineRef.current?.setTimeOfDay(hour);
  }, []);

  // Handle Camera switch
  const handleSelectCamera = useCallback((view: CameraView) => {
    setCameraView(view);
    engineRef.current?.setCameraView(view);
  }, []);

  // Handle Reset Car
  const handleResetCar = useCallback(() => {
    engineRef.current?.resetCarOnTrack();
  }, []);

  // Handle Start Game CTA
  const handleStartGame = useCallback(() => {
    setGameState('playing');
    engineRef.current?.resume();
    // Default to dynamic chase camera
    engineRef.current?.setCameraView('chase');
    setCameraView('chase');
  }, []);

  // Handle Resume
  const handleResumeGame = useCallback(() => {
    engineRef.current?.resume();
    setGameState('playing');
  }, []);

  // Handle Restart
  const handleRestartGame = useCallback(() => {
    engineRef.current?.resetCarOnTrack();
    engineRef.current?.resume();
    setGameState('playing');
  }, []);

  // Handle Exit to Title Screen
  const handleExitToTitle = useCallback(() => {
    engineRef.current?.setCameraView('drone');
    setGameState('title');
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Isolated Three.js WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 overflow-hidden"
      />

      {/* WebGL Context Initialization Error Fallback */}
      {webglError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 pointer-events-auto">
          <div className="bg-slate-900 border border-red-500/50 p-6 md:p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center font-speed font-black text-xl mb-4">
              !
            </div>
            <h3 className="font-speed text-xl font-bold text-white mb-2 uppercase">
              WebGL Context Initializing
            </h3>
            <p className="text-xs text-slate-400 font-ui mb-6">
              Your browser or graphics driver reported: <br />
              <span className="text-red-300 font-mono text-[11px] break-all">{webglError}</span>
            </p>
            <button
              onClick={() => initEngine()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-speed text-sm font-bold shadow-lg shadow-cyan-500/30 cursor-pointer w-full transition-all"
            >
              RETRY WEBGL INITIALIZATION
            </button>
          </div>
        </div>
      )}

      {/* Bluetooth Gamepad Connected Toast */}
      {gamepadToast && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-ui font-semibold animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{gamepadToast}</span>
        </div>
      )}

      {/* Screen 1: Title Screen & Supercar Garage Selector */}
      {gameState === 'title' && !webglError && (
        <TitleScreen
          selectedCarId={selectedCarId}
          onSelectCar={handleSelectCar}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          onStartGame={handleStartGame}
          gamepadName={gamepadName}
          isGamepadActive={isGamepadActive}
        />
      )}

      {/* Screen 2: Active Gameplay HUD */}
      {gameState === 'playing' && (
        <>
          <HUD
            telemetry={telemetry}
            weatherState={weatherState}
            speedTrapFlash={speedTrapFlash}
            isGamepadActive={isGamepadActive}
            gamepadName={gamepadName}
          />

          <ControlOverlay
            selectedCarId={selectedCarId}
            onSelectCar={handleSelectCar}
            currentWeather={currentWeather}
            onSelectWeather={handleSelectWeather}
            timeOfDay={timeOfDay}
            onSetTimeOfDay={handleSetTimeOfDay}
            cameraView={cameraView}
            onSelectCamera={handleSelectCamera}
            onResetCar={handleResetCar}
            isGamepadActive={isGamepadActive}
            gamepadName={gamepadName}
          />
        </>
      )}

      {/* Screen 3: Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseMenu
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onExitToTitle={handleExitToTitle}
          isGamepadActive={isGamepadActive}
          gamepadName={gamepadName}
        />
      )}
    </div>
  );
}
