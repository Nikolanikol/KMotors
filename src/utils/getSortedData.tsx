export const getSortedData = (arr: any[]) => {
  if (!arr || arr.length === 0) return [];
  return arr
    .filter((item) => item.Count != 0)
    .sort((a, b) => b.Count - a.Count);
};
