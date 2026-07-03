const Message = require('../models/Message');

const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    socket.on('join_chat', (userId) => {
      onlineUsers.set(userId, socket.id);
    });

    socket.on('send_message', async (data) => {
      try {
        const newMessage = await Message.create({
          sender: data.sender,
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

    socket.on('edit_message', async ({ messageId, newContent, senderId, receiverId }) => {
      try {
        const msg = await Message.findById(messageId);
        
        if (msg && String(msg.sender) === String(senderId) && !msg.isDeleted) {
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

    socket.on('delete_message', async ({ messageId, senderId, receiverId }) => {
      try {
        const msg = await Message.findById(messageId);
        
        if (msg && String(msg.sender) === String(senderId)) {
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
};