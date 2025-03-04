const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

// Handler untuk memproses event yang masuk
const handleEvent = (event) => {
  const { type, data } = event;

  if (type === 'PostCreated') {
    const { id, title } = data;
    posts[id] = { id, title };
  }

  console.log('Handled event:', type);
};

// Endpoint untuk mendapatkan semua post
app.get('/posts', (req, res) => {
  return res.send(posts);
});

// Endpoint untuk membuat post baru
app.post('/posts', async (req, res) => {
  const id = randomBytes(4).toString('hex');
  const { title } = req.body;

  posts[id] = { id, title };

  // Kirim event ke event bus
  await axios.post('http://localhost:4005/events', {
    type: 'PostCreated',
    data: { id, title },
  });

  return res.status(201).send(posts[id]);
});

// Endpoint untuk menerima event dari event service
app.post('/events', (req, res) => {
  console.log('Event Received:', req.body.type);
  handleEvent(req.body);
  return res.send({});
});

// Start server dan replay event dari event service saat startup
app.listen(4000, async () => {
  console.log('Listening on 4000');

  try {
    const res = await axios.get('http://localhost:4005/events');

    for (let event of res.data) {
      console.log('Processing event:', event.type);
      handleEvent(event);
    }
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
});
