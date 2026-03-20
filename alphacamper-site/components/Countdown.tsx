"use client";
import { useState, useEffect } from "react";

export function Countdown() {
  const [h, setH] = useState("--");
  const [m, setM] = useState("--");
  const [s, setS] = useState("--");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function update() {
      const now = new Date();
      const target = new Date(now);
      target.setHours(7, 0, 0, 0);
      if (now >= target) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      setH(String(Math.floor((diff % 864e5) / 36e5)).padStart(2, "0"));
      setM(String(Math.floor((diff % 36e5) / 6e4)).padStart(2, "0"));
      setS(String(Math.floor((diff % 6e4) / 1e3)).padStart(2, "0"));
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return <div style={{ height: 76 }} />;

  return (
    <>
      <div className="hero-countdown">
        <div className="cd-block">
          <div className="cd-num">{h}</div>
          <div className="cd-label">Hours</div>
        </div>
        <div className="cd-sep">:</div>
        <div className="cd-block">
          <div className="cd-num">{m}</div>
          <div className="cd-label">Min</div>
        </div>
        <div className="cd-sep">:</div>
        <div className="cd-block">
          <div className="cd-num">{s}</div>
          <div className="cd-label">Sec</div>
        </div>
      </div>
      <span className="cd-context">Next booking window opens at 7:00 AM PT</span>
    </>
  );
}
