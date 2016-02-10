'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var updateSchema = new Schema({
  sourceName: String,
  versionNo: String,
  filePath:  String,
  retrieved: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Update', updateSchema);
