const connect = ({ host, port, ssl = false }) => {
  return new Promise((resolve, reject) => {
    const webSocket = new WebSocket(`${ssl ? 'wss' : 'ws'}://${host}:${port}`);
    webSocket.onopen = () => resolve(webSocket);
    webSocket.onerror = () => reject(new Error('faild connect!'));
  });
};

export default async (servers) => {
  for (const server of servers) {
    try {
      return await connect(server);
    } catch (error) {
      continue;
    }
  }
};