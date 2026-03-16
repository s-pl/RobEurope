import { Bot } from 'lucide-react';

const robots = [
  { id: 1, size: 'h-5 w-5', delay: '0s', duration: '22s', bottom: '8%' },
  { id: 2, size: 'h-4 w-4', delay: '8s', duration: '28s', bottom: '14%' },
];

const FloatingRobots = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {robots.map((r) => (
        <div
          key={r.id}
          className="robot-runner absolute -left-16 text-stone-300/10 dark:text-stone-600/10"
          style={{
            bottom: r.bottom,
            animationDelay: r.delay,
            animationDuration: r.duration,
          }}
        >
          <Bot className={r.size} />
        </div>
      ))}
    </div>
  );
};

export default FloatingRobots;
