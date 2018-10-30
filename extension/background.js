chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (message) {
    if (message.type === 'SCREEN_REQUEST') {
      chrome.desktopCapture.chooseDesktopMedia(
        ['screen', 'window'],
        port.sender.tab,
        function (streamId) {
          if (!streamId) message.type = 'SCREEN_CANCEL';

          message.type = 'SCREEN_SHARE';
          message.streamId = streamId;
          port.postMessage(message);
        }
      );
    }
  });
});