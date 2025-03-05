const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
const serviceName = "Moderation Service";
const eventBusEndPoint = "http://localhost:4005";

const handleEvent = async (type, data) => {
  if (type === "CommentCreated") {
    console.log("📩 Event: CommentCreated event received");

    // 🛑 Moderasi komentar
    const status = data.content.includes("orange") ? "rejected" : "approved";

    await axios.post("http://localhost:4005/events", {
      type: "CommentModerated",
      data: {
        id: data.id,
        postId: data.postId,
        status,
        content: data.content,
      },
      from: "Moderation Service",
    });
  }
};

app.post("/events", async (req, res) => {
  const { type, data } = req.body;
  await handleEvent(type, data);
  res.send({});
});

app.listen(4003, async () => {
  console.log("🚀 Listening on port 4003");

  try {
    // 🔄 Ambil event lama dari Event Service
    const res = await axios.get(`${eventBusEndPoint}/events/${serviceName}`);
    if (res.data.length === 0) {
      console.log("✅ All previous events were already consumed.");
      return;
    } else {
      for (let event of res.data) {
        await handleEvent(event.type, event.data);
      }
    }
  } catch (error) {
    console.error("❗ Error fetching events:", error.message);
  }
});
