export const jerarquias = [
  "Comandante Mayor",
  "Comandante Principal",
  "Comandante",
  "Segundo Comandante",
  "Primer Alférez",
  "Alférez",
  "Subalférez",
  "Suboficial Mayor",
  "Suboficial Principal",
  "Sargento Ayudante",
  "Sargento Primero",
  "Sargento",
  "Cabo Primero",
  "Cabo",
  "Gendarme"
];

export const sortEvaluations = (evaluations) => {
  return [...evaluations].sort((a, b) => {
    // 1. Sort by category (CAT 1 -> CAT 4)
    const catA = parseInt((a.categoria || '').replace('CAT ', '')) || 0;
    const catB = parseInt((b.categoria || '').replace('CAT ', '')) || 0;
    if (catA !== catB) return catA - catB;

    // 2. Sort by hierarchy (index in jerarquias array)
    const rankIndexA = jerarquias.indexOf(a.jerarquia);
    const rankIndexB = jerarquias.indexOf(b.jerarquia);
    
    // If a rank is not found, put it at the end
    const safeRankA = rankIndexA === -1 ? 999 : rankIndexA;
    const safeRankB = rankIndexB === -1 ? 999 : rankIndexB;

    return safeRankA - safeRankB;
  });
};
