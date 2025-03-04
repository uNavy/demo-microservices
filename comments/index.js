const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

// Handler untuk memproses event yang masuk
const handleEvent = (event) => {
  const { type, data } = event;

  if (type === 'CommentCreated') {
    const { id, content, postId, status } = data;
    const comments = commentsByPostId[postId] || [];
    comments.push({ id, content, status });
    commentsByPostId[postId] = comments;
  }

  if (type === 'CommentModerated') {
    const { postId, id, status, content } = data;
    const comments = commentsByPostId[postId];

    if (comments) {
      const comment = comments.find((comment) => comment.id === id);
      if (comment) {
        comment.status = status;
      }
    }

    axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: { id, status, postId, content },
    }).catch(err => console.error('Error sending CommentUpdated event:', err.message));
  }

  console.log('Handled event:', type);
};

// Endpoint untuk mendapatkan semua komentar dari post tertentu
app.get('/posts/:id/comments', (req, res) => {
  return res.send(commentsByPostId[req.params.id] || []);
});

// Endpoint untuk menambahkan komentar ke sebuah post
app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  const { content } = req.body;

  const comments = commentsByPostId[req.params.id] || [];
  comments.push({ id: commentId, content, status: 'pending' });

  commentsByPostId[req.params.id] = comments;

  // Kirim event ke event bus
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId: req.params.id, status: 'pending' },
  }).catch(err => console.error('Error sending CommentCreated event:', err.message));

  return res.status(201).send(comments);
});

// Endpoint untuk menerima event dari event bus
app.post('/events', (req, res) => {
  console.log('Event Received:', req.body.type);
  handleEvent(req.body);
  return res.send({});
});

// Start server dan replay event dari event service saat startup
app.listen(4001, async () => {
  console.log('Listening on 4001');

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
