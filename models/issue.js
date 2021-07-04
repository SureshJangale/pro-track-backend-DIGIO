const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const issueSchema = new Schema({
  id:{
    type:String,
    unique:true,
    required:true
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    required: true
  },
  description: {
    type: String,
    min:5,
    max:10000
  },
  listPosition:{
    type:Number,
    required: true
  },
  estimate: {
    type: Number,
    default:0
  },
  timeSpent: {
    type: Number,
    default:0
  },
  timeRemaining: {
    type: Number,
    default:0
  },
  dateDue: {
    type: Date,
    default:Date.now()
  },
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  assignees: [{
    type: Schema.Types.ObjectId,
    ref: "User",
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment",
  }]
},
  {
    timestamps:true
  }
);

module.exports = Issue = mongoose.model("Issue", issueSchema);
