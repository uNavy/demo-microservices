const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const connectDB = require("./db_connection"); // Import the MongoDB connection
const Event = require("./models/Event"); // Import Event Model

const app = express();
app.use(bodyParser.json());
app.use(cors());

// 🔥 Connect to MongoDB
connectDB();

// Event Routing Rules
const eventRoutes = {
  PostCreated: ["Query Service"],
  PostSavedOnQueryService: ["Posts Service"],
  CommentCreated: ["Comments Service", "Moderation Service", "Query Service"],
  CommentModerated: ["Comments Service"],
  CommentUpdated: ["Comments Service", "Query Service"],
};

// Service URLs
const serviceUrls = {
  "Posts Service": "http://localhost:4000/events",
  "Comments Service": "http://localhost:4001/events",
  "Query Service": "http://localhost:4002/events",
  "Moderation Service": "http://localhost:4003/events",
  "Event Bus": "http://localhost:4005/events",
};

// Handle incoming events
app.post("/events", async (req, res) => {
  const { type, data, from } = req.body;
  const eventId = uuidv4();

  const destinations = eventRoutes[type] || [];

  const newEvent = new Event({
    _id: eventId,
    type,
    data,
    from,
    routes: destinations.map((service) => ({
      to: service,
      url: serviceUrls[service],
      status: "pending",
    })),
  });

  await newEvent.save();

  // Send event to designated services
  for (const route of newEvent.routes) {
    try {
      const result = await axios.post(route.url, { type, data, from });
      console.log(`📩 Event ${type} from 📡 ${from} sent to ${route.to}`);

      // Update event status
      await Event.updateOne(
        { _id: eventId, "routes.to": route.to },
        {
          $set: {
            "routes.$.status": "consumed",
            "routes.$.consumedAt": new Date(),
          },
        }
      );
    } catch (error) {
      console.error(`❌ Failed to send event to ${route.to}:`, error.message);
    }
  }

  res.send({ status: "OK" });
});

// Retrieve all events
app.get("/events/:requester", async (req, res) => {
  const requester = req.params.requester; // Extract requester from URL
  console.log(`🔄 Fetching all events... Requested by: 📡 ${requester}`);

  try {
    // Find all events where at least one route has a pending status
    const pendingEvents = await Event.find({ "routes.status": "pending" });

    // If no pending events, return early
    if (pendingEvents.length === 0) {
      console.log(` No pending events found for requester: 📡 ${requester}`);
      return res.status(200).json([]);
    }

    // Send the pending events to the client
    res.status(200).json(pendingEvents);

    // After sending the response, update status to 'consumed'
    await Event.updateMany(
      { "routes.status": "pending" },
      {
        $set: {
          "routes.$[].status": "consumed",
          "routes.$[].consumedAt": new Date(),
        },
      }
    );

    console.log(`✅ All pending events marked as consumed. Requested by: 📡 ${requester}`);
  } catch (error) {
    console.error(`❌ Error fetching events for requester: ${requester}:`, error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Start the Event Service
app.listen(4005, () => {
  console.log("🚀 Event Bus (Director) listening on 4005");
});
