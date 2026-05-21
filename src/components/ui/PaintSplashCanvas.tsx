"use client";
import { useEffect, useRef, useCallback } from "react";

interface Ripple {
  x: number; y: number; radius: number; maxRadius: number;
  speed: number; opacity: number; lineWidth: number;
}
interface PaintDrop {
  x: number; y: number; radius: number;
  speed: number; opacity: number; color: string;
}

export default function PaintSplashCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const dropsRef = useRef<PaintDrop[]>([]);
  const mouseRef = useRef({ x: -1, y: -1 });
  const animRef = useRef<number>(0);

  const createRipple = useCallback((x: number, y: number) => {
    ripplesRef.current.push({
      x, y, radius: 0,
      maxRadius: 80 + Math.random() * 120,
      speed: 2 + Math.random() * 3,
      opacity: 0.6 + Math.random() * 0.4,
      lineWidth: 1 + Math.random() * 3,
    });
  }, []);

  const createPaintDrop = useCallback((x: number, y: number) => {
    const colors = ["#FF4500", "#FF6B1A", "#FF8C00", "#CC3300"];
    for (let i = 0; i < 3 + Math.random() * 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60;
      dropsRef.current.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        radius: 2 + Math.random() * 8,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.4 + Math.random() * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const autoInterval = setInterval(() => {
      if (ripplesRef.current.length < 5) {
        const x = Math.random() * canvas.offsetWidth;
        const y = Math.random() * canvas.offsetHeight;
        createRipple(x, y);
        createPaintDrop(x, y);
      }
    }, 1500);

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      createRipple(clientX - rect.left, clientY - rect.top);
      createPaintDrop(clientX - rect.left, clientY - rect.top);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    canvas.addEventListener("click", handleClick);
    if (!isTouchDevice) canvas.addEventListener("mousemove", handleMouseMove);

    const drawBackground = (w: number, h: number) => {
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.8);
      bgGrad.addColorStop(0, "#0F0F0F");
      bgGrad.addColorStop(1, "#0A0A0A");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 15; i++) {
        const sx = Math.random() * w, sy = Math.random() * h;
        const len = 50 + Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        const grad = ctx.createLinearGradient(sx, sy, sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.5, "#FF4500");
        grad.addColorStop(1, "transparent");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 10 + Math.random() * 40;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        ctx.stroke();
      }
      ctx.restore();
    };

    const animate = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      drawBackground(w, h);

      ripplesRef.current = ripplesRef.current.filter((r) => {
        r.radius += r.speed;
        r.opacity -= 0.003;
        r.speed *= 0.995;
        if (r.opacity <= 0) return false;
        for (let i = 0; i < 3; i++) {
          const rr = r.radius - i * 15;
          if (rr > 0) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 69, 0, ${r.opacity * (1 - i * 0.3)})`;
            ctx.lineWidth = r.lineWidth * (1 - i * 0.2);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        const glow = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.radius);
        glow.addColorStop(0, `rgba(255, 107, 26, ${r.opacity * 0.1})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fill();
        return true;
      });

      dropsRef.current = dropsRef.current.filter((d) => {
        d.y += d.speed;
        d.opacity -= 0.002;
        d.radius *= 0.999;
        if (d.opacity <= 0 || d.y > h + 20) return false;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = d.opacity;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(d.x - d.radius * 0.3, d.y - d.radius * 0.3, d.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      if (!isTouchDevice && mouseRef.current.x > 0) {
        const { x: mx, y: my } = mouseRef.current;
        ctx.beginPath();
        ctx.arc(mx, my, 40, 0, Math.PI * 2);
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 40);
        mg.addColorStop(0, "rgba(255, 69, 0, 0.15)");
        mg.addColorStop(1, "transparent");
        ctx.fillStyle = mg;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("click", handleClick);
      if (!isTouchDevice) canvas.removeEventListener("mousemove", handleMouseMove);
      clearInterval(autoInterval);
    };
  }, [createRipple, createPaintDrop]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
