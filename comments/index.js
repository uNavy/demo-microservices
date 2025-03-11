const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const pool = require("./db_connection"); // Import database connection

const app = express();
app.use(bodyParser.json());
app.use(cors());

const serviceName = "Comments Service";
const eventBusEndPoint = "http://localhost:4005";

// Handler untuk memproses event yang masuk
const handleEvent = async (event) => {
  const { type, data, from } = event;

  if (type === "CommentCreated") {
    console.log(`🔄 Processing event: ${event.type}, from: ${from}`);
    const { id } = data;

    try {
      const commentCheck = await pool.query(
        `SELECT * FROM public."comments" WHERE id = $1`,
        [id]
      );

      if (commentCheck.rows.length > 0) {
        console.log(`✅ Comment with ID ${id} exists.`);
      } else {
        console.warn(`🟡 Comment with ID ${id} NOT found in database!`);
      }
    } catch (err) {
      console.error(`❌ Error checking comment existence:`, err.message);
    }
  }

  if (type === "CommentModerated") {
    console.log(`🔄 Processing event: ${event.type}, from: ${from}`);
    const { id, status } = data;

    try {
      const commentCheck = await pool.query(
        `SELECT * FROM public."comments" WHERE id = $1`,
        [id]
      );

      const { content, postId } = commentCheck.rows[0];

      if (commentCheck.rows.length === 0) {
        console.warn(`⚠️ Comment ${id} not found, skipping update.`);
      } else {
        console.log(
          `🔍 Found Comment ${id}. Current Status: ${
            commentCheck.rows[0].status === "pending"
              ? "🟡 Pending"
              : "✅ Processed"
          }`
        );

        // Update the status in database
        await pool.query(
          `UPDATE public."comments" SET status = $1 WHERE id = $2`,
          [status, id]
        );

        console.log(
          `🚀 Comment ${id} updated! New Status: ${
            status === "rejected" ? "❌ Rejected" : "✅ Approved"
          }`
        );

        console.log(`✉️ Sending CommentUpdated event to Event Bus`);
        // Notify event bus
        await axios.post("http://localhost:4005/events", {
          type: "CommentUpdated",
          data: { id, postId, status, content },
          from: "Comments Service",
        });
      }
    } catch (err) {
      console.error(`❌ Error updating comment status:`, err.message);
    }
  }
};

// Endpoint untuk mendapatkan semua komentar dari post tertentu
app.get("/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, content, status FROM public."comments" WHERE post_id = $1`,
      [id]
    );

    return res.send(result.rows);
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    return res.status(500).send({ error: "Database error" });
  }
});

// Endpoint untuk menambahkan komentar ke sebuah post
app.post("/posts/:id/comments", async (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;
  const status = "pending";

  try {
    // Insert into PostgreSQL
    const result = await pool.query(
      `INSERT INTO public."comments" (post_id, content, status) VALUES ($1, $2, $3) RETURNING id`,
      [postId, content, status]
    );
    const commentId = result.rows[0].id;

    //! Send event to event bus
    await axios.post("http://localhost:4005/events", {
      type: "CommentCreated",
      data: { id: commentId, content, postId, status },
      from: "Comments Service",
    });

    return res.status(201).send({ id: commentId, content, status });
  } catch (err) {
    console.error("Error inserting comment into database:", err.message);
    return res.status(500).send({ error: "Database error" });
  }
});

// Endpoint untuk menerima event dari event bus
app.post("/events", (req, res) => {
  console.log("Event Received:", req.body.type);
  handleEvent(req.body);
  return res.send({});
});

// Start server dan replay event dari event service saat startup
app.listen(4001, async () => {
  console.log("🚀 Listening on port 4001");

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
});
