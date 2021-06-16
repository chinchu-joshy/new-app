var express = require("express");
var router = express.Router();
var express = require("express");
var teacherHelper = require("../helpers/teacher-helper");
var studentHelper = require("../helpers/student-helper");
var router = express.Router();
var paypal = require("paypal-rest-sdk");
const collections = require("../config/collection");
var client = require("twilio")(collections.ACCOUNTSID, collections.AUTH_TOCKEN);
var qs = require("querystring");
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.urlencoded({ extended: false });
var checksum_lib = require("../paytm/checksum");
var config = require("../paytm/config");

//const { getVideoDurationInSeconds } = require('get-video-duration')
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AXicyBaFlcL2JKV46FBi3IfvzNOERaEWGPEUwpPZNBuhnY5YX7D4mC1hUFydUSqdp5tsRD2pYq8u8j_p",
  client_secret:
    "EAyGaPoBaFCt4s8ppzF5WGrpvFIntic7oRwIQis3A5Pkr6RZB_sD6YBGGl154qZcAjbD8NEcWclvdaxt",
});

// From a local path...

// From a URL...

// From a readable stream...

const fs = require("fs");

let redirectlogin = (req, res, next) => {
  if (!req.session.loggIn) {
    res.redirect("/");
  } else {
    next();
  }
};
let redirecthome = (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect("/", { student: true });
  } else {
    next();
  }
};
router.get("/student-entry", (req, res) => {
  // console.log(req.session.student)
  if (req.session.user) {
    //res.render('student/student-otp')
    res.redirect("/");
  } else {
    res.render("student/student-otp");
    // res.redirect('/')
  }
});
router.get("/student-home", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let name = req.session.user.name;
  let look = await studentHelper.getStatusStart(name, date);
  let Writtenwork = await teacherHelper.getWorks();
  let Pdf = await teacherHelper.getPdf();
  //console.log(Pdf)
  let notepdf = await teacherHelper.getNotePdf();
  //console.log(notepdf)
  let link = await teacherHelper.getNotelink();
  let announcement = await teacherHelper.getAnnouncement();
  let payevents = await teacherHelper.getPayevent();
  let events = await teacherHelper.getNormalevent();
  res.render("student/student-home", {
    student: true,
    Writtenwork,
    Pdf,
    notepdf,
    link,
    user: req.session.user,
    announcement,
    payevents,
    events,
    look,
  });
});
router.post("/student-entry", (req, res) => {
  if (req.session.loggin) {
    //console.log(req.session.loggin)
    res.redirect("/student-home");
  } else {
    studentHelper.OtpSend(req.body).then((response) => {
      if (response.status) {
        req.session.user = response.user;
        //console.log(req.session.student)

        //console.log(req.session.student.loggIn)
        client.verify
          .services(collections.SERVICEID)
          .verifications.create({ to: response.user.mobile, channel: "sms" })
          .then((verification) => {
            console.log(verification.status);
            res.render("student/otp");
          });
      } else {
        req.session.loginerr = true;
        let val = response.val;

        res.render("student/student-otp", { val });
      }
    });
  }
});

//router.get('/next-stage', redirecthome,(req,res)=>{
//if(req.session.loggedIn){
//res.redirect('/home')
//}else{
// res.render('student/otp')

// }
//})

router.post("/verify", (req, res) => {
  if (req.session.user) {
    studentHelper.VerifyStudent(req.body).then(async (data) => {
      let Writtenwork = await teacherHelper.getWorks();
      let Pdf = await teacherHelper.getPdf();
      //console.log(Pdf)
      let notepdf = await teacherHelper.getNotePdf();
      //console.log(notepdf)
      let link = await teacherHelper.getNotelink();
      let announcement = await teacherHelper.getAnnouncement();
      let payevents = await teacherHelper.getPayevent();
      let events = await teacherHelper.getNormalevent();

      // console.log(req.session.student)

      client.verify
        .services(collections.SERVICEID)
        .verificationChecks.create({ to: data.mobile, code: data.code })
        .then((verification_check) => {
          console.log(verification_check.status);
          if (verification_check.status == "approved") {
            req.session.loggin = true;
            res.render("student/student-home", {
              student: true,
              Writtenwork,
              Pdf,
              notepdf,
              link,
              user: req.session.user,
              announcement,
              payevents,
              events,
            });
          } else {
            let val = true;
            res.render("student/otp", { val });
          }
        });
    });
  } else {
    res.redirect("/");
  }
});

router.get("/student-login", (req, res) => {
  res.render("student/student-login");
});
router.get("/student-register", (req, res) => {
  res.render("student/student-signup");
});
router.post("/student-register", (req, res) => {
  studentHelper.dosignup(req.body).then((data) => {
    req.session.loggedIn = true;
    res.render("student/student-login");
  });
});
router.post("/student-login", (req, res) => {
  studentHelper.dologin(req.body).then(async (response) => {
    let Writtenwork = await teacherHelper.getWorks();
    let Pdf = await teacherHelper.getPdf();
    //console.log(Pdf)
    let notepdf = await teacherHelper.getNotePdf();
    //console.log(notepdf)
    let link = await teacherHelper.getNotelink();
    let announcement = await teacherHelper.getAnnouncement();
    let payevents = await teacherHelper.getPayevent();
    let events = await teacherHelper.getNormalevent();

    let date_ob = new Date();
    let day = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let date = year + "-" + month + "-" + day;
    // console.log(req.session.student)
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      let name = req.session.user.name;
      let look = await studentHelper.getStatusStart(name, date);

      res.render("student/student-home", {
        student: true,
        user: req.session.user,
        Writtenwork,
        notepdf,
        Pdf,
        link,
        announcement,
        events,
        payevents,
        look,
      });

      //console.log(req.session.user)
    } else {
      let value=req.session.loginerr
      value = true;
      res.render("student/student-login",{value});
    }
  });
});
router.get("/student-out", (req, res) => {
  req.session.user = null;
  //console.log(req.session.student)
  res.redirect("/");
});
router.get("/class-works", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let students = req.session.user.name;
  let teacher = await teacherHelper.getTeacher();
  let Writtenwork = await teacherHelper.getWorks();
  let Pdf = await teacherHelper.getPdf();
  let name = req.session.user.name;
  let look = await studentHelper.getStatusStart(name, date);
  //console.log(students)
  res.render("student/student-work", {
    student: true,
    students,
    teacher,
    Writtenwork,
    Pdf,
    user: req.session.user,
    look,
  });
});
router.post("/class-work", async (req, res) => {
  let students = req.session.user.name;
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let Writtenwork = await teacherHelper.getWorks();
  let Pdf = await teacherHelper.getPdf();

  let look = await studentHelper.getStatusStart(students, date);
  teacherHelper.assignment(req.body).then((response) => {
    //console.log(req.body)
    let val = req.body.workId;
    let pdf = req.files.head;
    pdf.mv("public/assignments/" + val + ".pdf", (err, done) => {
      if (!err) {
        res.render("student/student-work", {
          student: true,
          students,
          Writtenwork,
          Pdf,
          user: req.session.user,
          look,
        });
      } else {
        res.send("ERROR");
      }
    });
  });
});
router.get("/study-materials", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;

  let notepdf = await teacherHelper.getNotePdf();
  // console.log(notepdf)
  let link = await teacherHelper.getNotelink();
  let name = req.session.user.name;
  let look = await studentHelper.getStatusStart(name, date);
  //console.log(students)
  res.render("student/study-materials", {
    student: true,
    notepdf,
    link,
    user: req.session.user,
    look,
  });
});
router.get("/today-task", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  console.log(date);
  let Writtenwork = await teacherHelper.getWorksdate(date);
  let Pdf = await teacherHelper.getPdfdate(date);
  //console.log(Pdf)
  let students = req.session.user.name;
  let look = await studentHelper.getStatusStart(students, date);
  let user = req.session.user;

  // console.log(req.session.student)
  res.render("student/today-task", {
    student: true,
    user,
    Writtenwork,
    Pdf,
    look,
    students,
  });
});
router.get("/class-video", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let name = req.session.user.name;
  let notepdf = await teacherHelper.getVideo(date);
  let look = await studentHelper.getStatusStart(name, date);
  res.render("student/Class-video", {
    student: true,
    notepdf,
    user: req.session.user,
    name,
    look,
  });
});
router.post("/watch-video", (req, res) => {
  teacherHelper.addStatus(req.body).then((response) => {
    res.json(response);
  });
});
router.get("/testing", async (req, res) => {
  let name = req.session.user.name;
  var events = await teacherHelper.getAttByStudent(name);

  //let events={
  //eventss:event
  //}
  console.log(events);
  let video = await teacherHelper.getVideos();

  res.render("student/sample", { events, video });
});
router.get("/student-attendance", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let name = req.session.user.name;
  let details = await teacherHelper.getAttByStudent(name);
  let look = await studentHelper.getStatusStart(name, date);

  res.render("student/student-attendance", {
    student: true,
    details,
    user: req.session.user,
    look,
  });
});

router.get("/student-announcement", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let name = req.session.user.name;
  let announcement = await teacherHelper.getAnnouncement();
  let look = await studentHelper.getStatusStart(name, date);
  res.render("student/student-announcement", {
    student: true,
    announcement,
    user: req.session.user,
    look,
  });
});
router.get("/student-events", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let payevents = await teacherHelper.getPayevent();
  let events = await teacherHelper.getNormalevent();
  let name = req.session.user.name;
  let email = req.session.user.email;
  let look = await studentHelper.getStatusStart(name, date);
  res.render("student/student-events", {
    student: true,
    events,
    payevents,
    user: req.session.user,
    name,
    email,
    look,
  });
});
router.post("/payment", (req, res) => {
  teacherHelper.addpayment(req.body).then((response) => {
    const create_payment_json = {
      intent: "sale",

      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: response.events,
                sku: "001",
                price: response.prices,
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: response.prices,
          },
          description: response.events,
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        teacherHelper
          .addtoken(
            req.session.user.name,
            req.session.email,
            payment.id,
            response.prices,
            response.orderId
          )
          .then(() => {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                res.redirect(payment.links[i].href);
              }
            }
          });
      }
    });
  });
});

router.get("/success", async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  let value = await teacherHelper.findtoken(paymentId);

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: value.money,
        },
      },
    ],
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));
        res.render("student/student-login", { payerId });
      }
    }
  );
});

router.get("/cancel", (req, res) => {
  let value = true;
  res.render("student/failed", { value });
});
router.get("/back", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let name = req.session.user.name;

  let look = await studentHelper.getStatusStart(name, date);
  res.render("student/student-home", { student: true, look });
});
router.get("/student-photos", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let name = req.session.user.name;

  let look = await studentHelper.getStatusStart(name, date);
  let pic = await teacherHelper.getpic();
  res.render("student/student-gallery", {
    student: true,
    pic,
    look,
    user: req.session.user,
  });
});
router.get("/payment-method", (req, res) => {
  res.render("student/payment");
});
router.get("/razorpay/:id", async (req, res) => {
  let val = req.session.user.name;

  teacherHelper.addTopaymentList(req.params.id, val).then(async () => {
    let event = await teacherHelper.getOneEvent(req.params.id);

    res.render("student/razorpay", {
      event,
      student: true,
      user: req.session.user,
    });
  });
});
router.get("/paypal/:id", async (req, res) => {
  let val = req.session.user.name;

  teacherHelper.addTopaymentList(req.params.id, val).then(async () => {
    let event = await teacherHelper.getOneEvent(req.params.id);

    res.render("student/paypal", {
      event,
      student: true,
      user: req.session.user,
    });
  });
});
router.get("/paytm/:id", async (req, res) => {
  let val = req.session.user.name;

  teacherHelper.addTopaymentList(req.params.id, val).then(async () => {
    let event = await teacherHelper.getOneEvent(req.params.id);

    res.render("student/paytm", {
      event,
      student: true,
      user: req.session.user,
    });
  });
});
router.post("/paynow", [parseUrl, parseJson], async (req, res) => {
  // Route for making payment

  var val = await studentHelper.addptm(req.body);

  var paymentDetails = {
    amount: req.body.price,
    customerId: req.body.username,
    customerEmail: req.body.email,
    customerPhone: req.body.phone,
    orderId: req.body.id,
  };
  console.log(paymentDetails);
  if (
    !paymentDetails.amount ||
    !paymentDetails.customerId ||
    !paymentDetails.customerEmail ||
    !paymentDetails.customerPhone
  ) {
    res.status(400).send("Payment failed");
  } else {
    var params = {};
    params["MID"] = config.PaytmConfig.mid;
    params["WEBSITE"] = config.PaytmConfig.website;
    params["CHANNEL_ID"] = "WEB";
    params["INDUSTRY_TYPE_ID"] = "Retail";
    params["ORDER_ID"] = paymentDetails.orderId;
    //'TEST_'  + new Date().getTime();
    params["CUST_ID"] = paymentDetails.customerId;
    params["TXN_AMOUNT"] = paymentDetails.amount;
    params["CALLBACK_URL"] = "http://localhost:3000/callback";
    params["EMAIL"] = paymentDetails.customerEmail;
    params["MOBILE_NO"] = paymentDetails.customerPhone;

    checksum_lib.genchecksum(
      params,
      config.PaytmConfig.key,
      function (err, checksum) {
        var txn_url = "https://securegw-stage.paytm.in/order/process"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

        var form_fields = "";
        for (var x in params) {
          form_fields +=
            "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields +=
          "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(
          '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' +
            txn_url +
            '" name="f1">' +
            form_fields +
            '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
        );
        res.end();
      }
    );
  }
});
router.post("/callback", async (req, res) => {
  console.log(req.body);
  if (req.body.STATUS === "TXN_SUCCESS") {
    let val = await studentHelper.findptm(req.body.ORDERID);
  }
  // Route for verifiying payment

  var body = "";

  req.on("data", function (data) {
    body += data;
  });

  req.on("end", function () {
    var html = "";
    var post_data = qs.parse(body);

    // received params in callback
    console.log("Callback Response: ", post_data, "\n");

    // verify the checksum
    var checksumhash = post_data.CHECKSUMHASH;
    // delete post_data.CHECKSUMHASH;
    var result = checksum_lib.verifychecksum(
      post_data,
      config.PaytmConfig.key,
      checksumhash
    );
    console.log("Checksum Result => ", result, "\n");

    // Send Server-to-Server request to verify Order Status
    var params = { MID: config.PaytmConfig.mid, ORDERID: post_data.ORDERID };

    checksum_lib.genchecksum(
      params,
      config.PaytmConfig.key,
      function (err, checksum) {
        params.CHECKSUMHASH = checksum;
        post_data = "JsonData=" + JSON.stringify(params);

        var options = {
          hostname: "securegw-stage.paytm.in", // for staging
          // hostname: 'securegw.paytm.in', // for production
          port: 443,
          path: "/merchant-status/getTxnStatus",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": post_data.length,
          },
        };

        // Set up the request
        var response = "";
        var post_req = https.request(options, function (post_res) {
          post_res.on("data", function (chunk) {
            response += chunk;
          });

          post_res.on("end", function () {
            console.log("S2S Response: ", response, "\n");

            var _result = JSON.parse(response);
            if (_result.STATUS == "TXN_SUCCESS") {
              res.send("payment sucess");
            } else {
              res.send("payment failed");
            }
          });
        });

        // post the data
        post_req.write(post_data);
        post_req.end();
      }
    );
  });
  if (req.body.STATUS === "TXN_SUCCESS") {
    let payerId = req.body.STATUS;
    res.render("student/student-login", { payerId });
  } else {
    let val = req.body.RESPMSG;
    res.render("student/failed", { val });
  }
});
router.post("/razorpay", (req, res) => {
  let ids = req.body.id;
  let money = parseInt(req.body.price);

  studentHelper.getRazorpay(ids, money).then((response) => {
    res.json(response);
  });
  router.post("/verify-payment", (req, res) => {
    studentHelper
      .verifypayment(req.body)
      .then(() => {
        studentHelper.changePtatus(req.body["order[receipt]"]).then(() => {
          console.log("success");
          res.json({ status: true });
        });
      })
      .catch((err) => {
        res.json({ status: false });
      });
  });
});
router.get("/order-success", (req, res) => {
  let payerId = true;
  res.render("student/student-login", { user: req.session.user, payerId });
});
router.get("/index", (req, res) => {
  res.render("student/index", { student: true });
});
router.get("/show", async (req, res) => {
  let val = req.query;

  let details = await teacherHelper.getmonth(val);
  console.log(details);
  res.render("student/show-months", {
    student: true,
    details,
    user: req.session.user,
  });
});
router.get('/student-profile',async(req,res)=>{
  let val = req.session.user.name;
 let profile=await  teacherHelper.studentProfile(val)
  res.render("student/student-profile", {student: true, user: req.session.user,profile});
})
module.exports = router;







