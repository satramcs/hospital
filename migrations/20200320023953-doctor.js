'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  db.createTable('doctor', {
    id: {
      type: 'int',
      primaryKey: true,
      autoIncrement: true,
      length: 11
    },
    name: {
      type: 'string',
      length: 255
    },
    course: {
      type: 'string',
      length: 255
    },
    doctor_image: {
      type: 'string',
      length: 255
    },
  }, function(err) {
    if (err) return callback(err);
    return callback();
  });
};
exports.down = function(db, callback) {
  db.dropTable('doctor', callback);
};

exports._meta = {
  "version": 1
};
