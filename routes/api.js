'use strict';

const mongoose = require("mongoose");

const { Reply, Thread } = require("../models/schemas");

const URI = process.env.DB; 
mongoose.connect(URI).catch((err) => console.log(err));

mongoose.connection.on("error", (err) => {
  console.log("Mongoose connection error: " + err);
});

module.exports = function (app) {

  app.route('/api/threads/:board').post(async (req, res) => {

    const { board } = req.params;
    const { text, delete_password, replies } = req.body;

    let timeNow = Date.now();

    let newReplies = [];
    if (replies) {
      newReplies = replies.map(reply => {
        return new Reply({
          text: reply.text,
          created_on: timeNow,
          delete_password: reply.delete_password,
          reported: false
        });
      });
    }

    let thread = new Thread({
      board,
      text,
      created_on: timeNow,
      bumped_on: timeNow,
      delete_password,
      replies: newReplies
    });
    thread = await thread.save();
    res.send(thread);
  });

  app.route('/api/threads/:board').delete(async (req, res) => {

    const { board } = req.params;
    const { thread_id, delete_password } = req.body;

    let thread = await Thread.findOne({ board }).exec();
    if (thread.delete_password === delete_password) {
      await Thread.deleteOne({ _id: thread_id });
      res.send("success");
    } else {
      res.send("incorrect password");
    }
  });

  app.route('/api/threads/:board').get(async (req, res) => {

      let threads = await Thread
        .find({ board: req.params.board })
        .select('-reported -delete_password')
        .sort('-bumped_on')
        .limit(10)
        .exec();

        threads = threads.map(thread => {
          thread = thread.toObject();
          thread.replies = thread.replies.slice(-3).map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
          }));
          return {
              _id: thread._id,
              text: thread.text,
              created_on: thread.created_on,
              bumped_on: thread.bumped_on,
              replies: thread.replies
          };
      });

      res.json(threads);
    }
  );

  app.route('/api/threads/:board').put(async (req, res) => {

    const { board } = req.params;
    const { thread_id } = req.body;

    await Thread.findOneAndUpdate(
        { _id: thread_id, board },
        { $set: { reported: true } }
    ).exec();

    res.send("reported");
    }
  );

  app.route('/api/replies/:board').post(async (req, res) => {

    const { board } = req.params;
    const { thread_id, text, delete_password } = req.body;

    let timeNow = new Date();

    const reply = new Reply({
        text: text,
        created_on: timeNow,
        delete_password: delete_password,
        reported: false
    });

    const threadToUpdate = await Thread.findOneAndUpdate(
      { _id: thread_id, board },
      {
          $push: { replies: reply },
          $set: { bumped_on: timeNow }
      },
      { new: true } 
    ).exec();

    res.json(threadToUpdate)
});

  app.route('/api/replies/:board').delete(async (req, res) => {

      const { board } = req.params;
      const { thread_id, reply_id, delete_password } = req.body;

      let thread = await Thread.findOne({ _id: thread_id, board }).exec();

      let reply = thread.replies.id(reply_id);
      if (reply.delete_password !== delete_password) {
          return res.send("incorrect password");
      }
      
      thread.bumped_on = new Date();
      thread.replies.id(reply_id).text = "[deleted]";
      await thread.save();

      res.send("success");
  }
);

  app.route('/api/replies/:board').get(async (req, res) => {

    const { board } = req.params;
    const { thread_id } = req.query;

    let thread = await Thread.findOne({ _id: thread_id, board }).exec();

    let threadToView = {
      _id: thread._id,
      text: thread.text,
      created_on: thread.created_on,
      bumped_on: thread.bumped_on,
      replies: thread.replies.map(reply => {
        return {
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on,
        }
      }),
    }
    res.send(threadToView)
  
  });

  app.route('/api/replies/:board').put(async (req, res) => {

    const { board } = req.params;
    const { thread_id, reply_id } = req.body;

    await Thread.findOneAndUpdate(
      { _id: thread_id, board, "replies._id": reply_id },
      { $set: { "replies.$.reported": true } }
    ).exec();

    res.send("reported");
  });
};