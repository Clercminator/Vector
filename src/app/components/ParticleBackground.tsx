import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  originalX: number;
  originalY: number;
}

const COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let dpr = window.devicePixelRatio || 1;

    const init = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      
      particles = [];
      const numberOfParticles = Math.floor((window.innerWidth * window.innerHeight) / 9000);
      
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        particles.push({
          x,
          y,
          originalX: x,
          originalY: y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2.5 + 1.0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const mouseX = mouse.current.x;
      const mouseY = mouse.current.y;
      const maxDistSq = 200 * 200;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Subtle drift/gravity
        p.vy += 0.01; 

        // Move towards original position (elasticity)
        const dxOrig = p.originalX - p.x;
        const dyOrig = p.originalY - p.y;
        p.vx += dxOrig * 0.003;
        p.vy += dyOrig * 0.003;

        // Mouse interaction using squared distance (faster)
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distSq = dxMouse * dxMouse + dyMouse * dyMouse;

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const force = (200 - dist) / 200;
          const angle = Math.atan2(dyMouse, dxMouse);
          p.vx -= Math.cos(angle) * force * 4;
          p.vy -= Math.sin(angle) * force * 4;
        }

        // Friction
        p.vx *= 0.94;
        p.vy *= 0.94;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off bottom/sides
        if (p.y > window.innerHeight) {
          p.y = window.innerHeight;
          p.vy *= -0.4;
        } else if (p.y < 0) {
          p.y = 0;
          p.vy *= -0.4;
        }
        
        if (p.x > window.innerWidth) {
          p.x = window.innerWidth;
          p.vx *= -0.4;
        } else if (p.x < 0) {
          p.x = 0;
          p.vx *= -0.4;
        }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleResize = () => {
      init();
    };

    init();
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
