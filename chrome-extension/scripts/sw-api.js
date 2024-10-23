export const analyzeImage = async (src) => {
  const dummyVerdict = Math.random() > .5;
  await chrome.storage.local.set({ [src]: dummyVerdict });
};
