export function severityColor(score: number) {
  if (score >= 0.75) return { color: '#dc2626', label: 'High', icon: '⚠️' };
  if (score >= 0.5) return { color: '#f59e0b', label: 'Medium', icon: '⚡' };
  return { color: '#16a34a', label: 'Low', icon: '✅' };
}
