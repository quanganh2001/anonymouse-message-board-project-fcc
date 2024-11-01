const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const replySchema = new Schema({
  text: String,
  created_on: Date,
  reported: { type: Boolean, default: false },
  delete_password: String
});
const Reply = mongoose.model('Reply', replySchema);

const threadSchema = new Schema({
  board: String,
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: { type: Boolean, default: false },
  delete_password: String,
  replies: [replySchema]
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = { Reply, Thread };