/**
 * Procedural Textures for Tokyo Horizon
 * Zero external image dependencies - 100% canvas-generated PBR and emissive maps
 */

import * as THREE from 'three';

// 1. Asphalt Road Texture with Lane Markings and Rumble Strips
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base dark asphalt
  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, 1024, 1024);

  // Gravel micro-grain noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 36;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain + 2)); // subtle cool road tint
  }
  ctx.putImageData(imgData, 0, 0);

  // Outer solid lane markings
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(40, 0, 18, 1024);
  ctx.fillRect(1024 - 58, 0, 18, 1024);

  // Center dashed dividing line (Japanese expressway style)
  ctx.fillStyle = '#f59e0b'; // Amber center line
  for (let y = 0; y < 1024; y += 128) {
    ctx.fillRect(506, y, 12, 70);
  }

  // Lane dividers (white dashes)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let y = 0; y < 1024; y += 128) {
    ctx.fillRect(268, y, 10, 60);
    ctx.fillRect(746, y, 10, 60);
  }

  // Japanese speed limit stencil on road "80"
  ctx.save();
  ctx.translate(390, 512);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 110px "Orbitron", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('80', 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 2. Wet Road Roughness & Puddle Map (CarX Street Style)
export function createWetRoadRoughnessTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Default road roughness
  ctx.fillStyle = '#888888';
  ctx.fillRect(0, 0, 512, 512);

  // Draw organic glossy puddles (darker in roughness map = slick mirror reflection)
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radiusX = 35 + Math.random() * 70;
    const radiusY = 20 + Math.random() * 45;
    const angle = Math.random() * Math.PI;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radiusX);
    grad.addColorStop(0, '#111111'); // Ultra glossy puddle core
    grad.addColorStop(0.7, '#333333');
    grad.addColorStop(1, '#888888');

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 3. Carbon Fiber 2x2 Twill Weave Texture
export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 64, 64);

  // 2x2 twill diagonal weave
  const pSize = 16;
  for (let x = 0; x < 64; x += pSize) {
    for (let y = 0; y < 64; y += pSize) {
      const isAlt = ((x / pSize) + (y / pSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#1d222b' : '#0d0f12';
      ctx.fillRect(x, y, pSize, pSize);

      // Weave grain highlights
      ctx.fillStyle = isAlt ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)';
      ctx.fillRect(x + 2, y + 2, pSize - 4, pSize - 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

// 4. Drilled Carbon Ceramic Brake Rotor Texture
export function createBrakeRotorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#444850';
  ctx.fillRect(0, 0, 256, 256);

  // Concentric radial brushing
  for (let r = 20; r < 120; r += 2) {
    ctx.strokeStyle = `rgba(200, 210, 225, ${0.1 + (r % 6 === 0 ? 0.15 : 0.05)})`;
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cross-drilled cooling holes
  ctx.fillStyle = '#111114';
  for (let ring = 45; ring <= 110; ring += 18) {
    const holeCount = Math.floor(ring / 4);
    for (let h = 0; h < holeCount; h++) {
      const angle = (h / holeCount) * Math.PI * 2 + (ring * 0.1);
      const x = 128 + Math.cos(angle) * ring;
      const y = 128 + Math.sin(angle) * ring;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 5. Tokyo Highway Overhead Gantry Sign (Green Shuto Expressway Sign)
export function createHighwayGantrySign(text1: string, text2: string, exitNo: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Iconic Japanese expressway green
  ctx.fillStyle = '#0a5c36';
  ctx.fillRect(0, 0, 512, 256);

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 240);

  // Route badge (C1 / Wangan)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(30, 28, 64, 40);
  ctx.fillStyle = '#0a5c36';
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('C1', 62, 58);

  // Exit badge
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(400, 28, 80, 36);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(exitNo, 440, 55);

  // Japanese Kanji Destination (e.g. 新宿 渋谷 / 湾岸線)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px "Hiragino Kaku Gothic Pro", "Meiryo", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text1, 30, 150);

  // English Destination & Lane Arrows
  ctx.font = '600 32px "Rajdhani", sans-serif';
  ctx.fillStyle = '#d1fae5';
  ctx.fillText(text2, 30, 205);

  // Forward Arrows
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('▲', 390, 195);
  ctx.fillText('▲', 445, 195);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 6. Neon Cyberpunk Tokyo Billboard Textures (Animated or Vibrant)
export function createTokyoNeonBillboard(variant: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, 512, 256);

  if (variant === 0) {
    // 湾岸 MIDNIGHT Racing Billboard
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#1e1035');
    grad.addColorStop(1, '#080816');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.font = 'bold 76px "Hiragino Kaku Gothic Pro", sans-serif';
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 25;
    ctx.textAlign = 'center';
    ctx.fillText('湾岸 MIDNIGHT', 256, 115);

    ctx.font = 'bold 36px "Orbitron", sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 20;
    ctx.fillText('SHUTO SPEED CLUB 300+', 256, 180);
  } else if (variant === 1) {
    // 大黒 DAIKOKU FUTO DRIFT MEET
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 30;
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('大黒 PA MEET', 256, 110);

    ctx.font = '600 32px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fillText('SUPERCAR & DRIFT NIGHTS', 256, 175);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('WEEKEND UNDERGROUND GATHERING', 256, 215);
  } else if (variant === 2) {
    // Cyberpunk Anime / Synthetic Tech ad
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#7c3aed');
    grad.addColorStop(1, '#db2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(12, 12, 488, 232);

    ctx.font = '900 68px "Rajdhani", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 25;
    ctx.fillText('NEO TOKYO 2088', 256, 100);

    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('ターボ ハイブリッド 超加速', 256, 160);

    ctx.font = '22px "Orbitron", sans-serif';
    ctx.fillStyle = '#a5f3fc';
    ctx.fillText('BUGATTI BOLLIDE PROTO-TYPE X', 256, 205);
  } else {
    // APEX PERFORMANCE / MOTUL / BREMBO RACING
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(20, 20, 472, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 50px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('APEX RACING', 256, 72);

    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('極限 制動 / 鍛造', 256, 150);

    ctx.font = '24px "Rajdhani", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('COMPETITION MOTORSPORT TIRES', 256, 205);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 7. Japanese License Plate
export function createJapaneseLicensePlate(plateText: string = '品川 300 む 19-99'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 128);

  // Green border
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 116);

  // Mounting bolts
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(50, 25, 6, 0, Math.PI * 2);
  ctx.arc(206, 25, 6, 0, Math.PI * 2);
  ctx.fill();

  // Top registration (e.g. 品川 300)
  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('品川 300', 128, 38);

  // Bottom number
  ctx.font = 'bold 44px "Orbitron", sans-serif';
  ctx.fillText('19-99', 128, 92);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
