var db = require("../config/connection");
const collections = require("../config/collection");
const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectID;
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: "rzp_test_fu47ibK55eQ8Vq",
  key_secret: "L2KvFIhQ7a0qwEQJ1bEzEoGs",
});
module.exports = {
  VerifyStudent: (studentId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.STUDENT_DETAILS)
        .insertOne(studentId)
        .then((data) => {
          //console.log(data.ops[0])
          resolve(data.ops[0]);
        });
    });
  },

  OtpSend: (studentId) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collections.STUDENT_COLLECTION)
        .findOne({ rollnumber: studentId.rollnumber });
      //console.log(student)
      if (user) {
        response.user = user;
        response.status = true;
        resolve(response);
      } else {
        response.status = false;
        response.val = true;
        resolve(response);
      }
    });
  },
  getStatusStart: (user, dates) => {
    return new Promise(async (resolve, reject) => {
      let value = await db
        .get()
        .collection(collections.STATUS)
        .findOne({ Date: dates, student: user, attendance: "present" });
      resolve(value);
      console.log(value);
    });
  },
  dosignup: (userid) => {
    return new Promise(async (resolve, reject) => {
      userid.password = await bcrypt.hash(userid.password, 10);
      db.get()
        .collection(collections.STUDENT_LOGIN)
        .insertOne(userid)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },
  dologin: (userdata) => {
    return new Promise(async (resolve, reject) => {
      let loginstatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collections.STUDENT_LOGIN)
        .findOne({ email: userdata.email });
      if (user) {
        bcrypt.compare(userdata.password, user.password).then((status) => {
          if (status) {
            //console.log("success")
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            //console.log("fail")
            resolve({ status: false });
          }
        });
      } else {
        //console.log("fail")
        resolve({status: false });
      }
    });
  },
  getRazorpay: (id, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + id,
      };
      instance.orders.create(options, function (err, order) {
        resolve(order);
      });
    });
  },
  verifypayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "L2KvFIhQ7a0qwEQJ1bEzEoGs");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac === details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePtatus: (orderid) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CHECK_PAYMENT)
        .updateOne(
          { orderId: objectId(orderid) },
          {
            $set: {
              status: "Placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  addptm: (value) => {
    return new Promise((resolve, reject) => {
      let obj = {
        orderId: objectId(value.id),
        email: value.email,
        amount: value.price,
        student: value.username,
      };
      db.get()
        .collection(collections.PAYTM)
        .insertOne(obj)
        .then((data) => {
          resolve(data);
        });
    });
  },
  findptm: (orderid) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collections.PAYTM)
        .findOne({ orderId: objectId(orderid) });
      if (user) {
        db.get()
          .collection(collections.PAYTM)
          .updateOne(
            { orderId: objectId(orderid) },
            {
              $set: {
                status: "Placed",
              },
            }
          )
          .then(() => {
            resolve(user);
          });
      }
    });
  },
  getptm: (value) => {
    let val = objectId(value);

    return new Promise(async (resolve, reject) => {
      let val = await db
        .get()
        .collection(collections.PAYTM)
        .findOne({ status: "Placed", orderId: objectId(value) });
      if (val) {
        let student = await db
          .get()
          .collection(collections.STUDENT_COLLECTION)
          .findOne({ email: val.email });
        resolve(student);
      } else {
        resolve();
      }
    });
  },
  getpapl: (value) => {
    console.log(value);
    return new Promise(async (resolve, reject) => {
      let val = await db
        .get()
        .collection(collections.TOKEN)
        .find({ status: "Placed", orderId: objectId(value) })
        .toArray();
      console.log(val);
      if (val) {
        resolve(val);
      } else {
        resolve();
      }
    });
  },
  getRaz: (value) => {
    return new Promise(async (resolve, reject) => {
      let val = await db
        .get()
        .collection(collections.CHECK_PAYMENT)
        .find({ status: "Placed", orderId: objectId(value) })
        .toArray();
      console.log(val);
      if (val) {
        resolve(val);
      } else {
        resolve();
      }
    });
  },
};
