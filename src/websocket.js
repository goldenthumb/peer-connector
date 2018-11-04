const connect = ({ host, port, username, password, ssl = false }) => {
  return new Promise((resolve, reject) => {
    const accessAuth = username && password ? `${username}:${password}@`: '';
    const webSocket = new WebSocket(`${ssl ? 'wss' : 'ws'}://${accessAuth}${host}:${port}`);

    webSocket.onopen = () => resolve(webSocket);
    webSocket.onerror = () => reject(new Error('connect failed.'));
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