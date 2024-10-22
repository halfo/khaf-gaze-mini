const $ = function (args) {
  return document.querySelector(args);
};
const $$ = function (args) {
  return document.querySelectorAll(args);
};

HTMLElement.prototype.on = function (a, b, c) {
  return this.addEventListener(a, b, c);
};

const setState = async (state) => {
  await chrome.storage.local.set(state);
};

const getState = async (keys) => {
  return await chrome.storage.local.get(keys);
};

const guardInput = $('input[name="guard"]');
const grayscaleInput = $('input[name="grayscale"]');
const blurInput = $('input[name="blur"]');

grayscaleInput.on("click", (evt) => {
  setState({ grayscale: evt.target.checked });
});

blurInput.on("click", (evt) => {
  setState({ blur: evt.target.value });
});

const toggleGuard = (isEnabled) => {
  const others = $$('input:not([name="guard"])');
  others.forEach((input) => input.disabled = !isEnabled);

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (message) => {
          console.log("Is enabled:", message);
        },
        args: [isEnabled],
      });
    });
  });
};

guardInput.on("click", (evt) => {
  const isEnabled = evt.target.checked;

  setState({ guard: isEnabled });
  toggleGuard(isEnabled);
});

getState(["guard", "grayscale", "blur"])
  .then(({ guard, grayscale, blur }) => {
    if (guard) {
      guardInput.checked = true;
      grayscaleInput.checked = grayscale;
      blurInput.value = blur;

      toggleGuard(true);
    } else {
      grayscaleInput.checked = grayscale ?? grayscaleInput.checked;
      blurInput.value = blur ?? blurInput.value;

      setState({
        grayscale: grayscaleInput.checked,
        blur: blurInput.value,
      });
    }
  })
  .catch((_) => {
    console.error(
      'Failed to read from local storage in "kahf - guard - mini" extension.',
    );
    guardInput.disabled = true;
  });

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
