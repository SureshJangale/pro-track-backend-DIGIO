const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const commentSchema = new Schema({
  body: {
    type: String,
    required: true,
    max:50000
  },
   createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required:true
  },
  issue: {
    type: Schema.Types.ObjectId,
    ref: "Issue",
    required:true
  }
},
  {
    timestamps:true
  }
);

module.exports = Comment = mongoose.model("Comment", commentSchema);
