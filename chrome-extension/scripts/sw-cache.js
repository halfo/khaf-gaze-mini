export const getVerdict = async (src, tabId) => {
  // const { verdict } = await chrome.storage.local.get([src]);
  const verdict = false;

  return {
    src,
    tabId,
    verdict: verdict ?? false,
  };
};
