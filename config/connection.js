const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};
module.exports.connect = function (done) {
  const url = "mongodb://localhost:27017";
  const dbname = "school";
  mongoClient.connect(url, (err, data) => {
    if (err) return done(err);
    //data.db(dbname).collection('teacher').insertOne({'Name':'George',
    //'Password':'g@123'})
    state.db = data.db(dbname);
    done();
  });
};
module.exports.get = function () {
  return state.db;
};
