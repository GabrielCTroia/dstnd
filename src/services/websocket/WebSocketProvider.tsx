import React, { useEffect, useState, ReactNode } from 'react';
import { WSMessageRecord } from 'src/records/WSMessage';

// type ConnectionLifecycleContent = 

// type WSMessage = {
//   message_type: 'connection_opened' | 'connection_closed';
//   content: {
//     address: string;
//     peers_count: number;
//     peers_active: number;
//   };
// } | {
//   message_type: 'peer_call';
//   content: {
//     peer_address: string;
//   };
// }

type Props = {
  url: string;

  render?: (p: {
    sendMessage: (msg: WSMessageRecord) => void,
  }) => ReactNode;

  onOpen?: (event: unknown) => void;
  onMessage?: (event: WebSocketMessageEvent) => void;
  onClose?: (event: WebSocketCloseEvent) => void;
  onError?: (event: WebSocketErrorEvent) => void;
}

export const WebSocketProvider: React.FunctionComponent<Props> = ({
  onOpen = () => {},
  onMessage = () => {},
  onClose = () => {},
  onError = () => {},
  ...props
}) => {  
  const [socket, setSocket] = useState<null | WebSocket>(null);

  useEffect(() => {
    const socket = new WebSocket(props.url);

    socket.onopen = onOpen;
    socket.onerror = (event) => {
      // Hack! For some reason there are multiple definiions of this
      //  and the message is not always required
      // Let's see if it works in reallife!
      onError(event as unknown as WebSocketErrorEvent);
    };
    socket.onclose = onClose;
    socket.onmessage = onMessage;

    // socket.send();

    setSocket(socket);
  }, []);

  // Don't return anything until the socket connection is ready
  if (!socket) {
    return null;
  }

  if (props.render) {
    return (
      <>
        {props.render({
          sendMessage: (msg) => {
            socket.send(JSON.stringify(msg));
            console.log('WS.sendMessage', msg);
          }
        })}
      </>
    );
  }

  return <>{props.children}</>;
}