import { analyzeImage } from "./sw-api.js";
import { getVerdict } from "./sw-cache.js";

chrome.runtime.onMessage.addListener((message) => {
  switch (message.action) {
    case "analyze-image": {
      analyzeImage(message.payload);

      return true;
    }
    case "get-verdict": {
      const { src, tabId } = message.payload;
      getVerdict(src, tabId).then((result) => {
        chrome.runtime.sendMessage({ action: "verdict", payload: result });
      });

      return true;
    }
  }
});
