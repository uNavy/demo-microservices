const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const handleEvent = async (type, data) => {
  if (type === 'CommentCreated') {
    console.log('Event: CommentCreated event received');
    
    // Moderasi komentar
    const status = data.content.includes('orange') ? 'rejected' : 'approved';

    await axios.post('http://localhost:4005/events', {
      type: 'CommentModerated',
      data: {
        id: data.id,
        postId: data.postId,
        status,
        content: data.content,
      },
    });
  }
};

app.post('/events', async (req, res) => {
  const { type, data } = req.body;
  await handleEvent(type, data);
  res.send({});
});

app.listen(4003, async () => {
  console.log('Listening on 4003');

  try {
    // Ambil event lama dari Event Service
    const res = await axios.get('http://localhost:4005/events');
    
    for (let event of res.data) {
      console.log('Processing event:', event.type);
      await handleEvent(event.type, event.data);
    }
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
});
