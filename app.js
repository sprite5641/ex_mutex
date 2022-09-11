const express = require("express");
const Mutex = require("async-mutex").Mutex;
const app = express();
const db = require("./models");
const mutex = new Mutex();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// connect to the database
(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

// create a new event
app.post("/event", async (req, res) => {
  const max = 20;

  const event = await db.event.create({
    max_join: max,
  });

  return res.status(200).json(event);
});

// join an event
app.post("/event/join", async (req, res) => {
  const { id } = req.body;

  let t = null;
  try {
    t = await db.sequelize.transaction();
    const event = await db.event.findByPk(id, {
      transaction: t,
    });

    if (!event) {
      await t.rollback();
      return res.status(404).json({ message: "Event not found" });
    }

    const event_members = await db.event_member.findAll({
      where: {
        event_id: id,
      },
      transaction: t,
    });

    const members = event_members;
    if (members.length >= event.max_join) {
      await t.rollback();
      console.log("Event is full join");
      return res.status(400).json({ message: "Event is full" });
    }
    const name = members.length.toString();
    await db.event_member.create(
      {
        members: name,
        event_id: id,
      },
      {
        transaction: t,
      }
    );
    event.amount = event.amount + 1;
    await db.event.increment("amount", {
      by: 1,
      where: {
        id: id,
      },
      transaction: t,
    });
    console.log("Join event success", event.amount);
    await t.commit();
  } catch (error) {
    if (t) await t.rollback();
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }

  return res.status(200).json({ message: "Joined event" });
});

// join an event with mutex
app.post("/event/join_mutex", async (req, res) => {
  const release = await mutex.acquire();
  const { id } = req.body;

  let t = null;
  try {
    try {
      t = await db.sequelize.transaction();
      const event = await db.event.findByPk(id, {
        transaction: t,
      });

      if (!event) {
        await t.rollback();
        return res.status(404).json({ message: "Event not found" });
      }

      const event_members = await db.event_member.findAll({
        where: {
          event_id: id,
        },
        transaction: t,
      });

      const members = event_members;
      if (members.length >= event.max_join) {
        await t.rollback();
        console.log("Event is full join mutex");
        return res.status(400).json({ message: "Event is full" });
      }
      const name = members.length.toString();
      await db.event_member.create(
        {
          members: name,
          event_id: id,
        },
        { transaction: t }
      );
      event.amount = event.amount + 1;
      await db.event.increment("amount", {
        by: 1,
        where: {
          id: id,
        },
        transaction: t,
      });

      await t.commit();
    } catch (error) {
      if (t) await t.rollback();
      console.log(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  } finally {
    release();
  }

  return res.status(200).json({ message: "Joined event" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Example app listening on port 3000!"));
