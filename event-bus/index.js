const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const events = [];

app.post('/events', async (req, res) => {
  const event = req.body;

  console.log('Event Received:', event.type);
  events.push(event);

  const services = [
    'http://localhost:4000/events', // Posts Service
    'http://localhost:4001/events', // Comments Service
    'http://localhost:4002/events', // Query Service
    'http://localhost:4003/events', // Moderation Service
  ];

  for (const url of services) {
    try {
      await axios.post(url, event);
    } catch (error) {
      console.error(`Error sending event to ${url}:`, error.message);
    }
  }

  res.send({ status: 'OK' });
});

app.get('/events', (req, res) => {
  res.send(events);
});

app.listen(4005, () => {
  console.log('Event Bus listening on 4005');
});
