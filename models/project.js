const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema;


// Create Schema
const projectSchema = new Schema({
  title: {
    type: String,
    trim: true,
    max: 25,
    required: true,
    unique:true,
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  createdBy: {
    type: ObjectId, 
    ref: 'User',
    required: true
  },
  ownerId: {
    type: ObjectId, 
    ref: 'User',
  },
  description: {
    type: String,
    max:10000
  },
  category: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  users: [{ type: ObjectId, ref: 'User' }],
  issues: [{ type: ObjectId, ref: 'Issue' }],
},
  { timestamps: true }
);

module.exports = Project = mongoose.model("Project", projectSchema);
