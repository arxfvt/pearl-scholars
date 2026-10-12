"use client";
import { useEffect, useState } from "react";

export default function Countdown({ deadline }: { deadline: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(new Date(deadline).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  if (left === null) return <span className="text-muted">&nbsp;</span>;
  if (left <= 0) return <span className="font-bold text-red">Applications closed</span>;
  const days = Math.floor(left / 86400000);
  const hours = Math.floor((left % 86400000) / 3600000);
  return (
    <span className={days <= 14 ? "font-bold text-red" : "font-bold"}>
      {days} day{days === 1 ? "" : "s"} {hours}h left
    </span>
  );
}
