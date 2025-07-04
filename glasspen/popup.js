document.getElementById('activate').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      document.dispatchEvent(new CustomEvent('glasspen-activate'));
    }
  });
});