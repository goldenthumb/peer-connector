/**
 * @param {string} url
 * @param {string | string[]} protocols
 */
export default function connectWebsocket(url, protocols) {
    return new Promise((resolve, reject) => {
        const webSocket = new WebSocket(url, protocols);

        webSocket.onopen = () => resolve(webSocket);
        webSocket.onerror = () => reject(new Error('connect failed.'));
    });
}
