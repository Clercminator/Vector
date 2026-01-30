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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];

      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 8000);
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x,
          y,
          originalX: x,
          originalY: y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Subtle drift/gravity
        p.vy += 0.02; 

        // Move towards original position (elasticity)
        const dxOrig = p.originalX - p.x;
        const dyOrig = p.originalY - p.y;
        p.vx += dxOrig * 0.005;
        p.vy += dyOrig * 0.005;

        // Mouse interaction
        const dxMouse = mouse.current.x - p.x;
        const dyMouse = mouse.current.y - p.y;
        const dist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        const maxDist = 200;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          const angle = Math.atan2(dyMouse, dxMouse);
          p.vx -= Math.cos(angle) * force * 5;
          p.vy -= Math.sin(angle) * force * 5;
        }

        // Friction
        p.vx *= 0.95;
        p.vy *= 0.95;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off bottom/sides with energy loss
        if (p.y > canvas.height) {
          p.y = canvas.height;
          p.vy *= -0.5;
        }
        if (p.x > canvas.width || p.x < 0) {
          p.vx *= -0.5;
        }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

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
