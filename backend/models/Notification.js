const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  role: { 
    type: String, 
    required: true,
    enum: ['hr', 'admin', 'intern'] 
  },
  text: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true }); 
module.exports = mongoose.model('Notification', NotificationSchema);