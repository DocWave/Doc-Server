var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var updateSchema = new Schema({
  name: String,
  version: String,
  fileLocation:  String,
  retrieved: { type: Date, default: Date.now }
  }
});

module.exports = mongoose.model('Update', updateSchema);
