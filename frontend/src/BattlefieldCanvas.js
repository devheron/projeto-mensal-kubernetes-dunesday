import React, { useEffect, useRef } from 'react';

// Camada de tempestade do campo de batalha
// Faccao 0 e a tempestade de areia de Arrakis com raios quentes
// Faccao 1 e a nevoa de feiticaria de Latveria com descargas verdes
// Cor e movimento interpolam durante a virada para o corte nao ficar seco

const COUNT = 190;

const PALETTE = [
  { r: 232, g: 168, b: 84 },
  { r: 126, g: 196, b: 108 },
];

// Monta o caminho quebrado de um raio descendo a tela
function buildBolt(width, height) {
  const startX = width * (0.15 + Math.random() * 0.7);
  const endY = height * (0.45 + Math.random() * 0.35);
  const steps = 14;
  const points = [{ x: startX, y: -20 }];
  let x = startX;

  for (let i = 1; i <= steps; i++) {
    x += (Math.random() - 0.5) * (width * 0.07);
    points.push({ x, y: (endY / steps) * i });
  }

  // Ramificacao lateral sai de um ponto aleatorio do meio
  const forkFrom = points[Math.floor(steps * 0.5)];
  const fork = [forkFrom];
  let fx = forkFrom.x;
  let fy = forkFrom.y;
  for (let i = 0; i < 5; i++) {
    fx += (Math.random() - 0.3) * (width * 0.05);
    fy += endY * 0.08;
    fork.push({ x: fx, y: fy });
  }

  return { points, fork };
}

export default function BattlefieldCanvas({ faction }) {
  const canvasRef = useRef(null);
  const targetRef = useRef(faction);
  const mixRef = useRef(faction);

  // Guarda a faccao alvo sem recriar a animacao a cada troca
  useEffect(() => {
    targetRef.current = faction;
  }, [faction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let particles = [];
    let frame;
    let bolt = null;
    let boltLife = 0;
    let nextBolt = 2200 + Math.random() * 4000;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.4 + 0.4,
        speed: Math.random() * 1.1 + 0.2,
        drift: Math.random() * 0.5 - 0.25,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.4 + 0.1,
      }));
    };

    resize();
    spawn();

    const draw = (now) => {
      const dt = Math.min(now - last, 60);
      last = now;

      // Aproxima suavemente a mistura de cores do alvo
      mixRef.current += (targetRef.current - mixRef.current) * 0.012;
      const m = mixRef.current;
      const c = {
        r: Math.round(PALETTE[0].r + (PALETTE[1].r - PALETTE[0].r) * m),
        g: Math.round(PALETTE[0].g + (PALETTE[1].g - PALETTE[0].g) * m),
        b: Math.round(PALETTE[0].b + (PALETTE[1].b - PALETTE[0].b) * m),
      };

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      for (const p of particles) {
        // Areia corre na horizontal, nevoa sobe devagar e serpenteia
        const horizontal = p.speed * (2.1 - m * 1.8);
        const vertical = -p.speed * (0.08 + m * 0.45);

        p.phase += 0.008 + m * 0.006;
        p.x += horizontal + Math.sin(p.phase) * p.drift;
        p.y += vertical + Math.cos(p.phase * 0.7) * p.drift * (0.4 + m);

        if (p.x > width + 10) { p.x = -10; p.y = Math.random() * height; }
        if (p.x < -10) { p.x = width + 10; }
        if (p.y < -10) { p.y = height + 10; }
        if (p.y > height + 10) { p.y = -10; }

        // Rastro alongado so na areia, desaparece conforme vira nevoa
        const trail = p.speed * (1 - m) * 16;
        if (trail > 1) {
          ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${p.alpha * 0.5})`;
          ctx.lineWidth = p.r * 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x - trail, p.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }

        const radius = p.r * (1 + m * 1.8);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3);
        glow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${p.alpha})`);
        glow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dispara um raio novo quando o relogio do proximo zera
      nextBolt -= dt;
      if (nextBolt <= 0 && !bolt) {
        bolt = buildBolt(width, height);
        boltLife = 260;
        nextBolt = 2600 + Math.random() * 5200;
      }

      if (bolt) {
        boltLife -= dt;
        // Tremulacao: o raio pisca em vez de sumir linearmente
        const flicker = Math.random() > 0.35 ? 1 : 0.25;
        const life = Math.max(boltLife, 0) / 260;
        const intensity = life * flicker;

        // Clarao geral que lava a tela por um instante
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${intensity * 0.07})`;
        ctx.fillRect(0, 0, width, height);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},0.9)`;

        [bolt.points, bolt.fork].forEach((path, i) => {
          const scale = i === 0 ? 1 : 0.5;
          ctx.shadowBlur = 24 * scale;
          ctx.strokeStyle = `rgba(255,255,255,${intensity * 0.85 * scale})`;
          ctx.lineWidth = 2.2 * scale;
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let k = 1; k < path.length; k++) ctx.lineTo(path[k].x, path[k].y);
          ctx.stroke();

          // Halo colorido por fora do nucleo branco
          ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${intensity * 0.5 * scale})`;
          ctx.lineWidth = 6 * scale;
          ctx.stroke();
        });

        ctx.shadowBlur = 0;
        if (boltLife <= 0) bolt = null;
      }

      ctx.globalCompositeOperation = 'source-over';
      frame = requestAnimationFrame(draw);
    };

    if (reduced) {
      // Com movimento reduzido desenha um quadro estatico e para
      mixRef.current = targetRef.current;
      draw(performance.now());
      cancelAnimationFrame(frame);
    } else {
      frame = requestAnimationFrame(draw);
    }

    const onResize = () => { resize(); spawn(); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="battlefield" aria-hidden="true" />;
}
