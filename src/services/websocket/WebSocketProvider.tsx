import React, { useEffect, useState, ReactNode } from 'react';
import { WSMessageRecord } from 'src/records/WSMessage';
import { getWebRTC, WebRTC } from '../webrtc/web';
import { WebRTCSignallingChannelThroughWebSocket } from './WebRTCSignallingChannelThroughWebSocket';
import { Peer } from 'src/records/Peer';

type RTC = ReturnType<typeof getWebRTC>;

type Props = {
  url: string;

  render?: (p: {
    sendMessage: (msg: WSMessageRecord) => void,
    startP2P: (peer: Peer) => void,
    rtc: WebRTC,
  }) => ReactNode;

  onOpen?: () => void;
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
  const [rtc, setRTC] = useState<null | RTC>(null);
  

  useEffect(() => {
    // TODO: This should be once per app
    //  so it should be instantiated somewhere outside, maybe a singleton or smtg
    const socket = new WebSocket(props.url);

    const signallingChannel = new WebRTCSignallingChannelThroughWebSocket(socket);
    const rtc = getWebRTC(signallingChannel);

    socket.onopen = () => {
      onOpen();
      
      // Only set the socket once open
      setSocket(socket);
      setRTC(rtc);
    };
    socket.onerror = (event) => {
      // Hack! For some reason there are multiple definiions of this
      //  and the message is not always required
      // Let's see if it works in reallife!
      onError(event as unknown as WebSocketErrorEvent);
    };
    socket.onclose = (e) => {
      onClose(e);

      // Clear the socket once the connection closed
      setSocket(null);
    };
    // socket.onmessage = onMessage;
    socket.addEventListener('message', onMessage);

    // socket.addEventListener('message', () => {
    //   console.log('App 2');
    // });
  }, []);

  // Don't return anything until the socket connection is ready
  if (!(socket && rtc)) {
    return null;
  }

  if (props.render) {
    return (
      <>
        {props.render({
          sendMessage: (msg) => {
            socket.send(JSON.stringify(msg));
            console.log('WS.sendMessage', msg);
          },
          // Attempt to call peer
          startP2P: (peer) => {
            rtc.start(peer);
          },
          rtc,
        })}
      </>
    );
  }

  return <>{props.children}</>;
}