document.querySelectorAll("img").forEach((img) => {
  chrome.runtime.sendMessage({
    action: "analyze-image",
    payload: img.src,
  });
});
