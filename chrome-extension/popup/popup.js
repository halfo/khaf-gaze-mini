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
      obj[key] = await chrome.storage.local.get([key]);
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
              func: (isEnabled, blur, grayscale) => {
                document.querySelectorAll("img").forEach((img) => {
                  img.style.filter = isEnabled
                    ? `grayscale(${grayscale * 100}%) blur(${blur * 10}px)`
                    : `grayscale(0) blur(0)`;
                });
              },
              args: [obj.guard, obj.blur, obj.grayscale],
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
