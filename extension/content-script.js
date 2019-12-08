var port = chrome.runtime.connect(chrome.runtime.id);

port.onMessage.addListener(function (message) {
    window.postMessage(message, '*');
});

window.addEventListener('message', function (event) {
    if (event.source !== window || !event.data.type) return;
    if (event.data.type === 'SCREEN_REQUEST') port.postMessage(event.data);
});
