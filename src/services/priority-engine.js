function calculatePriority(severity, impact, frequency, duration) {
  // Ensure inputs are between 0 and 100
  const safeSeverity = Math.min(100, Math.max(0, severity || 0));
  const safeImpact = Math.min(100, Math.max(0, impact || 0));
  const safeFrequency = Math.min(100, Math.max(0, frequency || 0));
  const safeDuration = Math.min(100, Math.max(0, duration || 0));

  // Weights
  const score = Math.round(
    safeSeverity * 0.35 +
    safeImpact * 0.25 +
    safeFrequency * 0.20 +
    safeDuration * 0.20
  );

  const finalScore = Math.min(100, Math.max(0, score));

  let level = "Low";
  if (finalScore >= 90) level = "Critical";
  else if (finalScore >= 75) level = "High";
  else if (finalScore >= 50) level = "Medium";

  return {
    score: finalScore,
    level: level.toLowerCase(),
    breakdown: {
      severity: safeSeverity,
      impact: safeImpact,
      frequency: safeFrequency,
      duration: safeDuration
    }
  };
}

module.exports = {
  calculatePriority
};
