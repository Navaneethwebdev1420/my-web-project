// db/connection.js
const { MongoClient } = require('mongodb');

const state = {
  db: null
};

module.exports.connect = async function (done) {
  const url = 'mongodb://localhost:27017';
  const dbName = 'navan210'; // You can change this

  try {
    const client = await MongoClient.connect(url, { useUnifiedTopology: true });
    state.db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
    console.log('📂 Using Database:', state.db.databaseName);
    done();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    done(err);
  }
};

module.exports.get = function () {
  return state.db;
};



 