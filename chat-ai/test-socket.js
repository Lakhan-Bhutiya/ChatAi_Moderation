const { io } = require("socket.io-client");

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("connected");

  socket.emit("joinRoom", { roomId: "room-1" });

  socket.on("newMessage", (msg) => {
    console.log("NEW MESSAGE:", msg);
  });

  socket.on("messageDeleted", (data) => {
    console.log("MESSAGE DELETED:", data);
  });

  socket.emit("sendMessage", {
    roomId: "room-1",
    content: "hello"
  });
});
