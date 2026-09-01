function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateCategorySimilarity(cat1, cat2) {
  if (!cat1 || !cat2) return 0;
  return cat1.toLowerCase() === cat2.toLowerCase() ? 1.0 : 0.0;
}

function calculateGeographicSimilarity(lat1, lon1, lat2, lon2, maxRadiusKm = 1.0) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const distance = haversineDistance(lat1, lon1, lat2, lon2);
  if (distance > maxRadiusKm) return 0.0;
  // Linear decay: 0km = 1.0, 1km = 0.0
  return Math.max(0, 1 - (distance / maxRadiusKm));
}

function getTokens(text) {
  if (!text) return [];
  const normalized = text.toLowerCase().replace(/[.,!?;:]/g, '');
  const stopWords = ['is', 'the', 'of', 'and', 'a', 'to', 'in', 'that', 'it', 'for', 'on', 'with', 'as', 'this', 'was', 'at', 'by', 'an'];
  return normalized.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
}

function calculateSemanticSimilarity(text1, text2) {
  const tokens1 = new Set(getTokens(text1));
  const tokens2 = new Set(getTokens(text2));
  
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  
  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) intersection++;
  }
  
  // Jaccard similarity index
  const union = tokens1.size + tokens2.size - intersection;
  return intersection / union;
}

function calculateCombinedSimilarity(complaint, cluster, maxRadiusKm = 1.0) {
  const semantic = calculateSemanticSimilarity(complaint.description, cluster.title);
  const geographic = calculateGeographicSimilarity(complaint.latitude, complaint.longitude, cluster.latitude, cluster.longitude, maxRadiusKm);
  const category = calculateCategorySimilarity(complaint.category, cluster.category);

  // Weights: Semantic 60%, Geographic 25%, Category 15%
  const combinedScore = (semantic * 0.60) + (geographic * 0.25) + (category * 0.15);
  
  return {
    combinedScore,
    semantic,
    geographic,
    category
  };
}

function findBestClusterMatch(complaint, clusters, threshold = 0.3) {
  let bestMatch = null;
  let highestScore = 0;

  for (const cluster of clusters) {
    const { combinedScore } = calculateCombinedSimilarity(complaint, cluster);
    if (combinedScore > highestScore) {
      highestScore = combinedScore;
      bestMatch = cluster;
    }
  }

  if (highestScore >= threshold) {
    return { cluster: bestMatch, score: highestScore };
  }
  
  return { cluster: null, score: highestScore };
}


module.exports = {
  calculateCombinedSimilarity,
  findBestClusterMatch
};
