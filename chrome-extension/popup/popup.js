const $ = function (args) {
  return document.querySelector(args);
};

HTMLElement.prototype.on = function (a, b, c) {
  return this.addEventListener(a, b, c);
};

let State;

const guardInput = $('input[name="guard"]');
const grayscaleInput = $('input[name="grayscale"]');
const blurInput = $('input[name="blur"]');

grayscaleInput.on("click", (evt) => {
  State.grayscale = evt.target.checked;
});

blurInput.on("click", (evt) => {
  State.blur = evt.target.value;
});

const toggleGuard = (isEnabled) => {
  State.guard = isEnabled;

  const others = document.querySelectorAll('input:not([name="guard"])');
  others.forEach((input) => input.disabled = !isEnabled);
};

guardInput.on("click", (evt) => {
  toggleGuard(evt.target.checked);
});

const syncWithStore = (initialState) =>
  new Proxy(initialState, {
    async get(obj, key) {
      const { [key]: val } = await chrome.storage.local.get([key]);
      obj[key] = val;

      return obj[key];
    },
    set(obj, key, val) {
      obj[key] = val;

      // If any value is changed, take action
      // This might become a problem child
      chrome.storage.local.set({ [key]: val }).then(() => {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (tabId) => {
                document.querySelectorAll("img").forEach((img) =>
                  chrome.runtime.sendMessage({
                    action: "get-verdict",
                    payload: {
                      tabId,
                      src: img.src,
                    },
                  })
                );
              },
              args: [tab.id],
            });
          });
        });
      });

      return true;
    },
  });

const init = async () => {
  const { guard, grayscale, blur } = await chrome.storage.local.get([
    "guard",
    "grayscale",
    "blur",
  ]);

  State = syncWithStore({ guard, grayscale, blur });

  // Sync HTML with store
  if (guard) {
    guardInput.checked = true;
    grayscaleInput.checked = grayscale;
    blurInput.value = blur;

    toggleGuard(true);
  } else {
    grayscaleInput.checked = grayscale ?? grayscaleInput.checked;
    blurInput.value = blur ?? blurInput.value;

    // If store is empty, sync store with HTML default value
    State.grayscale = grayscaleInput.checked;
    State.blur = blurInput.value;
  }

  chrome.runtime.onMessage.addListener(async (message) => {
    switch (message.action) {
      case "verdict": {
        const { verdict, src, tabId } = message.payload;
        const guard = await State.guard;
        const grayscale = await State.grayscale;
        const blur = await State.blur;

        const tab = await chrome.tabs.get(tabId);
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (src, verdict, guard, grayscale, blur) => {
            document.querySelectorAll(`img[src="${src}"]`).forEach((img) => {
              img.style.filter = !verdict && guard
                ? `grayscale(${grayscale * 100}%) blur(${blur * 10}px)`
                : `grayscale(0) blur(0)`;
            });
          },
          args: [src, verdict, guard, grayscale, blur],
        });

        return true;
      }
    }
  });
};

init();

const __devListenToStorageChanges = () => {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`,
      );
    }
  });
};

// __devListenToStorageChanges();
