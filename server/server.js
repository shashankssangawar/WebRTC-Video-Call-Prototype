import { Server } from "socket.io";

const io = new Server(8000, {
  cors: {
    origin: "*",
  },
});

const connectionsMap = new Map();

io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  // ==================================================
  // JOIN ROOM
  // ==================================================
  socket.on("room:join", ({ email, username, room }) => {
    console.log(`${username} joined room ${room}`);
    connectionsMap.set(email, {
      id: socket.id,
      username,
      room,
    });

    socket.join(room);
    // Notify everyone already in room
    socket.to(room).emit(
      "user:joined",
      {
        email,
        username,
        room,
        id: socket.id,
      }
    );

    // Confirm join to current user
    socket.emit(
      "room:join",
      {
        email,
        username,
        room,
        id: socket.id,
      }
    );
  }
  );

  // ==================================================
  // INITIAL WEBRTC CALL
  // ==================================================

  socket.on(
    "user:call",
    ({ to, offer }) => {
      console.log(
        `CALL ${socket.id} -> ${to}`
      );

      io.to(to).emit(
        "incoming:call",
        {
          from: socket.id,
          offer,
        }
      );
    }
  );

  // ==================================================
  // CALL ACCEPTED
  // ==================================================

  socket.on(
    "call:accepted",
    ({ to, ans }) => {
      console.log(
        `CALL ACCEPTED ${socket.id} -> ${to}`
      );

      io.to(to).emit(
        "call:accepted",
        {
          from: socket.id,
          ans,
        }
      );
    }
  );

  // ==================================================
  // ICE CANDIDATE
  // ==================================================

  socket.on(
    "peer:ice-candidate",
    ({ to, candidate }) => {
      console.log(
        `ICE ${socket.id} -> ${to}`
      );

      io.to(to).emit(
        "peer:ice-candidate",
        {
          from: socket.id,
          candidate,
        }
      );
    }
  );

  // ==================================================
  // NEGOTIATION NEEDED
  // ==================================================

  socket.on(
    "peer:nego:needed",
    ({ to, offer }) => {
      console.log(
        `NEGOTIATION NEEDED ${socket.id} -> ${to}`
      );

      io.to(to).emit(
        "peer:nego:needed",
        {
          from: socket.id,
          offer,
        }
      );
    }
  );

  // ==================================================
  // NEGOTIATION DONE
  // ==================================================

  socket.on(
    "peer:nego:done",
    ({ to, ans }) => {
      console.log(
        `NEGOTIATION DONE ${socket.id} -> ${to}`
      );

      io.to(to).emit(
        "peer:nego:final",
        {
          from: socket.id,
          ans,
        }
      );
    }
  );

  // ==================================================
  // DISCONNECT
  // ==================================================

  socket.on("disconnect", () => {
    console.log(
      "Socket Disconnected:",
      socket.id
    );

    for (
      const [
        email,
        connection,
      ] of connectionsMap.entries()
    ) {
      if (
        connection.id === socket.id
      ) {
        connectionsMap.delete(email);

        io.to(
          connection.room
        ).emit(
          "user:left",
          {
            id: socket.id,
            email,
          }
        );

        break;
      }
    }
  });
});
