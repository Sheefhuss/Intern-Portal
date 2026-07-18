const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const onlineUsers = new Map();
let ioInstance = null;

function setup(io) {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required.'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {

    socket.on('join_chat', () => {
      onlineUsers.set(socket.userId, socket.id);
    });

    socket.on('send_message', async (data) => {
      try {
        const newMessage = await Message.create({
          sender: socket.userId,
          receiver: data.receiver,
          content: data.content
        });

        const receiverSocketId = onlineUsers.get(data.receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', newMessage);
        }
        socket.emit('message_sent', newMessage);
      } catch (error) {
        console.error('Socket error:', error);
      }
    });

    socket.on('edit_message', async ({ messageId, newContent, receiverId }) => {
      try {
        const msg = await Message.findById(messageId);

        if (msg && String(msg.sender) === String(socket.userId) && !msg.isDeleted) {
          const hoursDiff = (new Date() - new Date(msg.createdAt)) / (1000 * 60 * 60);

          if (hoursDiff <= 3) {
            msg.content = newContent;
            msg.isEdited = true;
            await msg.save();

            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('message_edited', msg);
            }
            socket.emit('message_edited', msg);
          }
        }
      } catch (error) {
        console.error('Socket edit error:', error);
      }
    });

    socket.on('delete_message', async ({ messageId, receiverId }) => {
      try {
        const msg = await Message.findById(messageId);

        if (msg && String(msg.sender) === String(socket.userId)) {
          msg.isDeleted = true;
          msg.content = "This message was deleted";
          await msg.save();

          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('message_deleted', msg);
          }
          socket.emit('message_deleted', msg);
        }
      } catch (error) {
        console.error('Socket delete error:', error);
      }
    });

    socket.on('disconnect', () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
}

function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;
  const socketId = onlineUsers.get(String(userId));
  if (socketId) ioInstance.to(socketId).emit(event, payload);
}

function emitToAll(event, payload) {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
}

module.exports = setup;
module.exports.emitToUser = emitToUser;
module.exports.emitToAll = emitToAll;