const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const pool = require("./db_connection"); // Import database connection

const app = express();
app.use(bodyParser.json());
app.use(cors());

const serviceName = "Query Service";
const eventBusEndPoint = "http://localhost:4005";

const handleEvent = async (type, data) => {
  try {
    if (type === "PostCreated") {
      const { id, title } = data;

      // Check if the post exists in the database
      const checkResult = await pool.query(
        "SELECT * FROM public.posts WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        // Insert new post
        await pool.query(
          "INSERT INTO public.posts (id, title) VALUES ($1, $2)", // Fix table name
          [id, title]
        );
        console.log(`🆕 Inserted new post with ID: ${id} | Title: "${title}"`);

        // 🔥 Emit PostSaved event
        await axios.post("http://localhost:4005/events", {
          type: "PostSavedOnQueryService",
          data: { id, title },
          from: "Query Service",
        });

        console.log(`📢 Event PostSaved broadcasted for ID: ${id}`);

        return { success: true, message: "Post created and event emitted" };
      } else {
        console.log(`✅ Post with ID ${id} already exists.`);
        return { success: true, message: "Post already exists" };
      }
    }
  } catch (error) {
    console.error(`❌ Error in handleEvent: ${error.message}`);
    throw new Error(`Error processing event: ${error.message}`);
  }

  if (type === "CommentCreated") {
    const { id, content, postId, status } = data;

    try {
      // Insert comment into the database
      await pool.query(
        `INSERT INTO public."comments" (id, post_id, "content", status) VALUES ($1, $2, $3, $4)`,
        [id, postId, content, status]
      );

      console.log(
        `💬 New Comment Added! ID: ${id} | Post ID: ${postId} | Status: ${
          status === "pending" ? "🟡 Pending" : "✅ Approved"
        }`
      );
    } catch (error) {
      console.error(
        `❌ Database error while inserting CommentCreated (ID: ${id}):`,
        error.message
      );
    }
  }

  if (type === "CommentUpdated") {
    const { id, status } = data;

    try {
      // Update comment status in the database
      const updateResult = await pool.query(
        `UPDATE public."comments" SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
      );

      if (updateResult.rows.length > 0) {
        console.log(
          `🔄 Comment Updated! ID: ${id} | New Status: ${
            status === "rejected" ? "❌ Rejected" : "✅ Approved"
          }`
        );
      } else {
        console.warn(`⚠️ Comment ${id} not found, unable to update.`);
      }
    } catch (error) {
      console.error(
        `❌ Database error while updating CommentUpdated (ID: ${id}):`,
        error.message
      );
    }
  }
};

app.get("/posts", async (req, res) => {
  try {
    // Fetch all posts
    const postResult = await pool.query("SELECT id, title FROM public.posts");

    // Fetch all comments
    const commentResult = await pool.query(
      "SELECT id, post_id, content, status FROM public.comments"
    );

    // Map comments to their respective posts
    const posts = postResult.rows.map((post) => ({
      ...post,
      comments: commentResult.rows
        .filter((comment) => comment.post_id === post.id)
        .map(({ id, content, status }) => ({ id, content, status })),
    }));

    return res.json(posts);
  } catch (error) {
    console.error("❌ Database fetch error:", error.message);
    return res.status(500).json({ error: "Database error" });
  }
});

app.post("/events", async (req, res) => {
  const { type, data } = req.body;

  try {
    const result = await handleEvent(type, data);
    return res
      .status(200)
      .json({ message: `Event ${type} processed successfully` });
  } catch (error) {
    console.log(`❌ Error processing event: ${error.message}`);
    return res
      .status(500)
      .json({ message: `Error processing event: ${error.message}` });
  }
});

app.listen(4002, async () => {
  console.log("🚀 Listening on port 4002");

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
