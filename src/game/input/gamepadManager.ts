/**
 * Unified Game Controller & Input Manager
 * Supports:
 * - Bluetooth Gamepads (Xbox, PlayStation, Android TV Gamepads, 8BitDo, etc.) via Gamepad API
 * - Android Smart TV D-Pad & Remote Control keys (DPadUp, DPadDown, DPadLeft, DPadRight, Select, Back)
 * - Keyboard & Mouse (WASD, Arrow keys, Space, Shift, C, R, Esc)
 * - Gamepad Haptic Rumble / Vibration Actuator feedback for crashes and redline!
 */

export interface InputState {
  throttle: number; // 0.0 to 1.0 (analog or digital)
  brake: number; // 0.0 to 1.0 (analog or digital)
  steer: number; // -1.0 (left) to 1.0 (right)
  handbrake: boolean;
  nitro: boolean;
  shiftUp: boolean;
  shiftDown: boolean;
  toggleCamera: boolean;
  resetCar: boolean;
  pause: boolean;
  menuSelect: boolean;
  menuBack: boolean;
  menuUp: boolean;
  menuDown: boolean;
  menuLeft: boolean;
  menuRight: boolean;
  isGamepadActive: boolean;
  gamepadName: string;
}

class InputManager {
  private keysHeld: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  private gamepadIndex: number | null = null;
  private gamepadName: string = '';
  private prevGamepadButtons: boolean[] = [];
  private onGamepadConnectedCallback: ((name: string) => void) | null = null;

  constructor() {
    this.setupKeyboardListeners();
    this.setupGamepadListeners();
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling on arrow keys or space on Android TV / browsers
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }
      if (!this.keysHeld.has(e.code)) {
        this.justPressedKeys.add(e.code);
      }
      this.keysHeld.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld.delete(e.code);
    });

    // Clear held keys on window blur to avoid stuck accelerator
    window.addEventListener('blur', () => {
      this.keysHeld.clear();
      this.justPressedKeys.clear();
    });
  }

  private setupGamepadListeners() {
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      this.gamepadIndex = e.gamepad.index;
      this.gamepadName = e.gamepad.id || 'Bluetooth Gamepad';
      if (this.onGamepadConnectedCallback) {
        this.onGamepadConnectedCallback(this.gamepadName);
      }
    });

    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.gamepadName = '';
      }
    });
  }

  public onGamepadConnected(callback: (name: string) => void) {
    this.onGamepadConnectedCallback = callback;
  }

  // Trigger haptic rumble on Bluetooth controller if supported
  public triggerVibration(durationMs: number = 100, strongMagnitude: number = 0.6, weakMagnitude: number = 0.4) {
    if (this.gamepadIndex === null) return;
    try {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[this.gamepadIndex];
      if (gp && 'vibrationActuator' in gp && (gp as unknown as { vibrationActuator?: { playEffect: Function } }).vibrationActuator) {
        (gp as unknown as { vibrationActuator: { playEffect: Function } }).vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude,
          strongMagnitude,
        });
      }
    } catch {
      // Haptics not supported or permitted
    }
  }

  public poll(): InputState {
    // 1. Keyboard / Android TV remote defaults
    let throttle = 0;
    let brake = 0;
    let steer = 0;
    let handbrake = false;
    let nitro = false;
    let shiftUp = false;
    let shiftDown = false;
    let toggleCamera = false;
    let resetCar = false;
    let pause = false;
    let menuSelect = false;
    let menuBack = false;
    let menuUp = false;
    let menuDown = false;
    let menuLeft = false;
    let menuRight = false;

    // Keyboard & Android TV remote key mappings
    // Gas: W, ArrowUp, Android TV DpadUp
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp') || this.keysHeld.has('DPadUp')) {
      throttle = 1.0;
    }
    // Brake / Reverse: S, ArrowDown, Android TV DpadDown
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown') || this.keysHeld.has('DPadDown')) {
      brake = 1.0;
    }
    // Steer Left: A, ArrowLeft, Android TV DpadLeft
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft') || this.keysHeld.has('DPadLeft')) {
      steer -= 1.0;
    }
    // Steer Right: D, ArrowRight, Android TV DpadRight
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight') || this.keysHeld.has('DPadRight')) {
      steer += 1.0;
    }

    // Handbrake: Space
    if (this.keysHeld.has('Space')) handbrake = true;
    // Nitro: Shift
    if (this.keysHeld.has('ShiftLeft') || this.keysHeld.has('ShiftRight') || this.keysHeld.has('KeyN')) nitro = true;

    // Edge-triggered actions
    if (this.justPressedKeys.has('KeyC')) toggleCamera = true;
    if (this.justPressedKeys.has('KeyR')) resetCar = true;
    if (this.justPressedKeys.has('Escape') || this.justPressedKeys.has('KeyP')) pause = true;
    if (this.justPressedKeys.has('KeyE')) shiftUp = true;
    if (this.justPressedKeys.has('KeyQ')) shiftDown = true;

    // UI Menu actions
    if (this.justPressedKeys.has('Enter') || this.justPressedKeys.has('Space')) menuSelect = true;
    if (this.justPressedKeys.has('Escape') || this.justPressedKeys.has('Backspace')) menuBack = true;
    if (this.justPressedKeys.has('ArrowUp') || this.justPressedKeys.has('KeyW')) menuUp = true;
    if (this.justPressedKeys.has('ArrowDown') || this.justPressedKeys.has('KeyS')) menuDown = true;
    if (this.justPressedKeys.has('ArrowLeft') || this.justPressedKeys.has('KeyA')) menuLeft = true;
    if (this.justPressedKeys.has('ArrowRight') || this.justPressedKeys.has('KeyD')) menuRight = true;

    // 2. Poll Bluetooth Gamepads (Android TV / Xbox / PS / Generic)
    let isGamepadActive = false;
    let activeName = this.gamepadName;

    if (navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      // Find the first active gamepad if not set
      let gp: Gamepad | null = null;
      if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
        gp = gamepads[this.gamepadIndex];
      } else {
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i] && gamepads[i]!.connected) {
            gp = gamepads[i];
            this.gamepadIndex = i;
            this.gamepadName = gp!.id;
            break;
          }
        }
      }

      if (gp && gp.connected) {
        isGamepadActive = true;
        activeName = gp.id;

        // Deadzone helper
        const deadzone = 0.15;
        const applyDeadzone = (val: number) => (Math.abs(val) < deadzone ? 0 : val);

        // Standard Gamepad Axis 0: Left Stick X for steering
        const stickX = applyDeadzone(gp.axes[0] || 0);
        if (Math.abs(stickX) > 0.05) {
          steer = THREE_clamp(stickX, -1, 1);
        }

        // Standard Gamepad Axis 1: Left Stick Y for throttle/brake alternative
        const stickY = applyDeadzone(gp.axes[1] || 0);
        if (stickY < -0.2) throttle = Math.max(throttle, -stickY);
        if (stickY > 0.2) brake = Math.max(brake, stickY);

        // Button 7: Right Trigger (RT / R2) -> Analog Throttle
        if (gp.buttons[7]) {
          const rtVal = typeof gp.buttons[7] === 'number' ? gp.buttons[7] : gp.buttons[7].value;
          if (rtVal > 0.05) throttle = Math.max(throttle, rtVal);
        }

        // Button 6: Left Trigger (LT / L2) -> Analog Brake
        if (gp.buttons[6]) {
          const ltVal = typeof gp.buttons[6] === 'number' ? gp.buttons[6] : gp.buttons[6].value;
          if (ltVal > 0.05) brake = Math.max(brake, ltVal);
        }

        // Button 0 (A / Cross): Handbrake / Drift or Menu Select
        const isButton0 = gp.buttons[0]?.pressed;
        if (isButton0) {
          handbrake = true;
        }

        // Button 1 (B / Circle): Nitro / Boost or Menu Back
        const isButton1 = gp.buttons[1]?.pressed;
        if (isButton1) {
          nitro = true;
        }

        // Button 5 (Right Bumper / RB / R1): Nitro
        if (gp.buttons[5]?.pressed) nitro = true;

        // Button 4 (Left Bumper / LB / L1): Handbrake
        if (gp.buttons[4]?.pressed) handbrake = true;

        // D-Pad buttons: 12 (Up), 13 (Down), 14 (Left), 15 (Right)
        if (gp.buttons[12]?.pressed) throttle = 1.0;
        if (gp.buttons[13]?.pressed) brake = 1.0;
        if (gp.buttons[14]?.pressed) steer = -1.0;
        if (gp.buttons[15]?.pressed) steer = 1.0;

        // Edge-triggered gamepad buttons
        const isJustPressed = (btnIndex: number) => {
          const isPressed = !!gp?.buttons[btnIndex]?.pressed;
          const wasPressed = !!this.prevGamepadButtons[btnIndex];
          return isPressed && !wasPressed;
        };

        if (isJustPressed(3)) toggleCamera = true; // Y / Triangle: Camera view
        if (isJustPressed(8)) resetCar = true; // Select / Back: Reset car
        if (isJustPressed(9)) pause = true; // Start / Options: Pause menu
        if (isJustPressed(5)) shiftUp = true; // RB: Shift up
        if (isJustPressed(4)) shiftDown = true; // LB: Shift down

        if (isJustPressed(0)) menuSelect = true;
        if (isJustPressed(1)) menuBack = true;
        if (isJustPressed(12)) menuUp = true;
        if (isJustPressed(13)) menuDown = true;
        if (isJustPressed(14)) menuLeft = true;
        if (isJustPressed(15)) menuRight = true;

        // Update previous buttons state
        this.prevGamepadButtons = gp.buttons.map((b) => b.pressed);
      }
    }

    // Reset edge triggers for next frame
    this.justPressedKeys.clear();

    return {
      throttle: THREE_clamp(throttle, 0, 1),
      brake: THREE_clamp(brake, 0, 1),
      steer: THREE_clamp(steer, -1, 1),
      handbrake,
      nitro,
      shiftUp,
      shiftDown,
      toggleCamera,
      resetCar,
      pause,
      menuSelect,
      menuBack,
      menuUp,
      menuDown,
      menuLeft,
      menuRight,
      isGamepadActive,
      gamepadName: activeName,
    };
  }
}

function THREE_clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export const inputManager = new InputManager();
