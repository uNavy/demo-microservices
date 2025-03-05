const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const pool = require("./db_connection"); // Import database connection

const app = express();
app.use(bodyParser.json());
app.use(cors());

const serviceName = "Posts Service";
const eventBusEndPoint = "http://localhost:4005";

const handleEvent = async (event) => {
  const { type, data, from } = event;

  if (type === "PostSavedOnQueryService") {
    console.log(`🔄 Processing event: ${event.type}, from: ${from}`);

    const { id } = data;

    try {
      // Check if post exists in the database
      const checkResult = await pool.query(
        "SELECT * FROM public.posts WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        console.warn(`⚠️ Post with ID ${id} not found in database!`);
      } else {
        console.log(
          `✅ Post with ID ${id} verified in database:`,
          checkResult.rows[0]
        );
      }
    } catch (error) {
      console.error(
        `❌ Database query error while verifying post ID ${id}:`,
        error.message
      );
    }
  }
  return;
};

// Endpoint to create a new post
app.post("/posts", async (req, res) => {
  const { title } = req.body;
  let globalId;
  try {
    // Insert into Post Service database
    const result = await pool.query(
      "INSERT INTO public.posts (title) VALUES ($1) RETURNING id",
      [title]
    );
    const id = result.rows[0].id;
    globalId = id;

    // Send event to event bus
    const eventResponse = await axios.post(`${eventBusEndPoint}/events`, {
      type: "PostCreated",
      data: { id, title },
      from: serviceName,
    });

    console.log(eventResponse.status)
    if (eventResponse.status !== 200) {
      throw new Error("Query Service did not acknowledge PostCreated");
    }

    console.log(`🚀 New Post Created: ${title} (ID: ${id})`);
    return res.status(201).send({ id, title });
  } catch (error) {
    console.error("❌ Post creation error:", error.message);

    // Rollback in case of failure
    await pool.query("DELETE FROM public.posts WHERE id = $1", [globalId]);

    return res.status(500).send({ error: "Rollback Posts, can't message is not consumed by Query Service" });
  }
});

// Endpoint to receive events from event service
app.post("/events", async (req, res) => {
  await handleEvent(req.body);
  return res.send({});
});

// Function to check database connection
const checkDatabaseConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW() AS current_time");
    console.log("🔗 Database connected:", res.rows[0].current_time);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1); // Stop the server if DB is not connected
  }
};

// Function to fetch events from event bus
const fetchEvents = async () => {
  try {
    // 🔄 Fetch old events from the Event Service
    const res = await axios.get(`${eventBusEndPoint}/events/${serviceName}`);

    if (res.data.length === 0) {
      console.log("✅ All previous events were already consumed.");
      return;
    }

    for (let event of res.data) {
      await handleEvent(event.type, event.data);
    }
  } catch (error) {
    console.error("❌ Error fetching events:", error.message);
  }
};

// Start server after checking database connection
app.listen(4000, async () => {
  console.log("📡 Server listening on port 4000...");
  await checkDatabaseConnection();
  await fetchEvents();
});
