'use client';

import { useState, useEffect, useRef } from 'react';
import { Wallet, Users, Globe, Zap } from 'lucide-react';

const ICONS = [Wallet, Users, Globe, Zap];
const LABELS = ['Total Paid Out', 'Active Users', 'Partner Platforms', 'Uptime'];

function CountUp({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export default function LandingStats() {
  const [targets, setTargets] = useState([25, 10000, 50, 9]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    setTargets([
      randomBetween(18, 42),
      randomBetween(8100, 15999),
      randomBetween(40, 80),
      randomBetween(7, 9),
    ]);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
      {LABELS.map((label, i) => {
        const Icon = ICONS[i];
        return (
          <div key={label} className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
            <Icon size={18} className="mx-auto text-indigo-500 mb-2.5" />
            <div className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
              {i === 0 && <>${<CountUp end={targets[0]} duration={2500} />}M+</>}
              {i === 1 && <><CountUp end={targets[1]} duration={2000} />+</>}
              {i === 2 && <><CountUp end={targets[2]} duration={1500} />+</>}
              {i === 3 && <>99.{targets[3]}%</>}
            </div>
            <div className="mt-1 text-[11px] font-medium text-gray-400">{label}</div>
          </div>
        );
      })}
    </div>
  );
}
