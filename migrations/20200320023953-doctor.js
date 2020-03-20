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
  }, createTimestamps);

  function createTimestamps(err){
    if(err){ callback(err); return; }

    db.connection.query([
      'ALTER TABLE doctor',
      'ADD updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP',
        'ON UPDATE CURRENT_TIMESTAMP,',
      'ADD created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP',
    ].join(' '), function(err){
      callback(err);
    });

  }

};
exports.down = function(db, callback) {
  db.dropTable('doctor', callback);
};

exports._meta = {
  "version": 1
};
