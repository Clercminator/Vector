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
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      particles = [];
      const numberOfParticles = Math.floor((window.innerWidth * window.innerHeight) / 10000); // Slightly fewer particles for cleaner look
      
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        particles.push({
          x,
          y,
          originalX: x,
          originalY: y,
          // Higher initial velocity for constant movement
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
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
        
        // Mouse interaction
        const dxMouse = mouseX - p.x;
        const dyMouse = mouseY - p.y;
        const distSq = dxMouse * dxMouse + dyMouse * dyMouse;

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const force = (200 - dist) / 200;
          const angle = Math.atan2(dyMouse, dxMouse);
          // Push away
          p.vx -= Math.cos(angle) * force * 0.5;
          p.vy -= Math.sin(angle) * force * 0.5;
        }

        // Limit velocity so they don't speed up infinitely from mouse interactions
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpeed = 2; 
        const minSpeed = 0.2; // Ensure they don't stop

        if (speed > maxSpeed) {
            p.vx = (p.vx / speed) * maxSpeed;
            p.vy = (p.vy / speed) * maxSpeed;
        } else if (speed < minSpeed && speed > 0) {
            // Give them a little normalized boost if they get too slow
             p.vx = (p.vx / speed) * minSpeed;
             p.vy = (p.vy / speed) * minSpeed;
        }
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.y > window.innerHeight) {
          p.y = window.innerHeight;
          p.vy *= -1;
        } else if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        }
        
        if (p.x > window.innerWidth) {
          p.x = window.innerWidth;
          p.vx *= -1;
        } else if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        }

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.7; // Slightly more transparent
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    
    // Reset mouse when leaving window so particles don't stick to edge
    const handleMouseLeave = () => {
        mouse.current.x = -1000;
        mouse.current.y = -1000;
    };

    const handleResize = () => {
      init();
    };

    init();
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
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
