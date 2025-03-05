const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const eventSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  type: String,
  data: Object,
  from: String, // Source Service
  createdAt: { type: Date, default: Date.now },
  routes: [
    {
      to: String, // Destination Service
      url: String,
      status: { type: String, enum: ['pending', 'consumed'], default: 'pending' },
      consumedAt: Date,
    },
  ],
});

module.exports = mongoose.model('Event', eventSchema);
