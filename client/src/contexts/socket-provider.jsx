import { SOCKET_BASE_URL } from "@/constants/urls";
import React, { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => io(SOCKET_BASE_URL), []);
  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
