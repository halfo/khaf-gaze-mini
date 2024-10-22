chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.action) {
    case "guardEnabled":
      enableGuard();
      return true;
    case "guardDisabled":
      disableGuard();
      return true;
  }
});
