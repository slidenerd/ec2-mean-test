//models.js
const mongoose = require('mongoose');

// ===============
// Database Config
// ===============
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

// =======
// Schemas
// =======

const jokesSchema = new Schema({
    content: String,
    created: { type: Date, default: Date.now }
},
    { strict: false }
);

const models = {};
models.Jokes = mongoose.model('jokes', jokesSchema);

module.exports = models;