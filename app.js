const express = require("express");

const app = express();

app.use(express.json());
const {
  models: { User },
} = require("./db");
const path = require("path");
const e = require("express");

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

const requireToken = async (req, res, next) => {
  try {
    req.user = await User.byToken(req.headers.authorization);
    next();
  } catch (error) {
    next(error);
  }
};

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

// TEST
// console.log(process.env.secret);

app.get("/api/auth", requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

// GET /api/users/:id
app.get("/api/users/:id/notes", requireToken, async (req, res, next) => {
  try {
    const user = req.user;
    if (user) {
      const notes = await user.getNotes();
      res.send(notes);
    }
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
