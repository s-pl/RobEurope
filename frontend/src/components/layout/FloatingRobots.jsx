import { Bot } from 'lucide-react';

const robots = [
  { id: 1, size: 'h-5 w-5', delay: '0s', duration: '18s', bottom: '8%' },
  { id: 2, size: 'h-4 w-4', delay: '6s', duration: '22s', bottom: '14%' },
  { id: 3, size: 'h-6 w-6', delay: '11s', duration: '26s', bottom: '5%' },
];

const FloatingRobots = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
      {robots.map((r) => (
        <div
          key={r.id}
          className="robot-runner absolute -left-16 text-blue-500/15 dark:text-blue-400/15"
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
