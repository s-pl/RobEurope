// Simple password strength estimator (score 0-4)
// Criteria: length, lowercase, uppercase, digits, symbols
export function getPasswordStrength(pw = '') {
  const result = { score: 0, label: 'Muy débil', color: '#ef4444' };
  if (!pw) return result;

  let score = 0;
  const length = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  if (length >= 8) score++;
  if (length >= 12) score++;
  if (hasLower && hasUpper) score++;
  if (hasDigit) score++;
  if (hasSymbol) score++;

  // Normalize to 0..4
  score = Math.min(4, Math.max(0, score - 1));

  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  return { score, label: labels[score], color: colors[score] };
}

export function StrengthBar({ score, color }) {
  const segments = 4;
  return (
    <div className="mt-2 flex gap-1" aria-label="password-strength">
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded"
          style={{ backgroundColor: i < score ? color : '#e5e7eb' }}
        />
      ))}
    </div>
  );
}
