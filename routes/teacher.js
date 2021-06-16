var express = require("express");
const multer = require("multer");
var teacherHelper = require("../helpers/teacher-helper");
var studentHelper = require("../helpers/student-helper");
var router = express.Router();
const collections = require("../config/collection");
const _ = require("lodash");
const cropper = require("cropperjs");
var fs = require("fs");

const storage = multer.diskStorage({
  destination: "./public/upload/",

  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".png");
  },
});
const upload = multer({ storage: storage }).array("uploadfile", 2);
//var upload = multer({ dest: 'uploads/' })

//const host = req.host;
//const filePath = req.protocol + "://" + host + '/' + req.file.path;

const { getVideoDurationInSeconds } = require("get-video-duration");

// From a local path...

// From a URL...

// From a readable stream...

//let upload=multer({storage:storage}).array('wrk',2);
let verify = (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    next();
  }
};
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("landing/landing-page", { land: true });
});
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.render("teacher/home", { teacher: true });
  } else {
    res.render("teacher/login", { login: req.session.loginerr });
    req.session.loginerr = false;
  }
});
router.post("/login", (req, res) => {
  teacherHelper.checkAccount(req.body).then(async (response) => {
    //console.log(req.body)
    let Writtenwork = await teacherHelper.getWorks();
    //console.log(Writtenwork)
    let Pdf = await teacherHelper.getPdf();
    //console.log(Pdf)
    let notepdf = await teacherHelper.getNotePdf();
    // console.log(notepdf)
    let link = await teacherHelper.getNotelink();
    // console.log(link)
    let announcement = await teacherHelper.getAnnouncement();
    let payevents = await teacherHelper.getPayevent();
    let events = await teacherHelper.getNormalevent();
    if (response.status) {
      console.log(link);
      req.session.teacher = response.teacher;
      req.session.loggedIn = true;
      let teacher = req.session.teacher;

      res.render("teacher/home", {
        teacher: true,
        teacher,
        Writtenwork,
        Pdf,
        notepdf,
        link,
        announcement,
        payevents,
        events,
      });
    } else {
      req.session.loginerr = true;
      res.redirect("/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
router.get("/profile", async (req, res) => {
  res.render("teacher/profile", { teacher: true });
});
router.get("/students", (req, res) => {
  teacherHelper.getStudents().then((students) => {
    res.render("teacher/students", { teacher: true, students });
  });
});
router.get("/add-student", (req, res) => {
  res.render("teacher/add-students", { teacher: true });
});

router.post("/added-student", (req, res) => {
  //console.log(req.body)
  teacherHelper.addStudent(req.body).then((id) => {
    let image = req.files.Image;
    image.mv("public/images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("teacher/add-students");
      } else {
        res.send("ERROR");
      }
    });
  });
});
router.get("/edit-student/:id", async (req, res) => {
  let students = await teacherHelper.getvalue(req.params.id);
  res.render("teacher/edit-student", { students, teacher: true });
});
router.post("/edit-student/:id", (req, res) => {
  teacherHelper.editStudent(req.body, req.params.id).then(async () => {
    let id = req.params.id;
    students = await teacherHelper.getStudents();
    res.render("teacher/students", { teacher: true, students });
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("public/images/" + id + ".jpg");
    }
  });
});
router.get("/delete-student/:id", (req, res) => {
  teacherHelper.deleteStudent(req.params.id).then(async () => {
    students = await teacherHelper.getStudents();
    res.render("teacher/students", { teacher: true, students });
  });
});
router.post("/edit-profile", (req, res) => {
  let image = req.files.Image;
  image.mv("public/teacher-image/" + "image" + ".jpg", (err, done) => {
    if (!err) {
      res.render("teacher/profile", { teacher: true });
    } else {
      res.send("ERROR");
    }
  });
});
router.get("/home", async (req, res) => {
  let Writtenwork = await teacherHelper.getWorks();
  //console.log(Writtenwork)
  let Pdf = await teacherHelper.getPdf();
  //console.log(Pdf)
  let notepdf = await teacherHelper.getNotePdf();
  // console.log(notepdf)
  let link = await teacherHelper.getNotelink();
  // console.log(link)
  let announcement = await teacherHelper.getAnnouncement();
  let payevents = await teacherHelper.getPayevent();
  let events = await teacherHelper.getNormalevent();
  res.render("teacher/home", {
    teacher: true,
    Writtenwork,
    Pdf,
    notepdf,
    link,
    announcement,
    payevents,
    events,
  });
});

router.get("/uploads", (req, res) => {
  res.render("teacher/uploads", { teacher: true });
});
//router.get('/messages', (req, res) => {
// Message.find({},(err, messages)=> {
//res.send(messages);
//})
//})
router.post("/student-work", (req, res) => {
  teacherHelper.addWorks(req.body).then((response) => {
    res.render("teacher/uploads", { teacher: true });
  });
  //console.log(req.body)
  //console.log(req.files)
});
router.post("/student-work-pdf", (req, res) => {
  if (req.files.wrk.mimetype == "application/pdf") {
    var type = "pdf";
  } else {
    var type = "jpg";
  }

  //console.log(type)
  teacherHelper.addPdf(req.body, type).then((response) => {
    let work = req.files.wrk;
    //console.log(work)

    //console.log(work.mimetype)
    if (work.mimetype == "application/pdf") {
      work.mv("public/uploads/" + response + ".pdf", (err, done) => {
        if (!err) {
          res.render("teacher/uploads", { teacher: true });
        } else {
          res.send("ERROR");
        }
      });
    } else {
      work.mv("public/uploads/" + response + ".jpg", (err, done) => {
        if (!err) {
          res.render("teacher/uploads", { teacher: true });
        } else {
          res.send("ERROR");
        }
      });
    }

    // }else{

    //}
    //res.render('teacher/uploads',{teacher:true})
    //let upload=multer({storage:storage}).array('wrk',2);
    //upload(req,res,function(err){
    // if(!req.file){
    //return res.send("invalid")
    //}
    // debug(req.files);
    // console.log(req.hostname+'/'+req.file.path)
    // })
  });
  //console.log(req.body)
  //console.log(req.files)
});

router.post("/student-link", (req, res) => {
  teacherHelper.addNotelink(req.body).then((response) => {
    res.render("teacher/uploads", { teacher: true });
  });
  //console.log(req.body)
  //console.log(req.files)
});
router.post("/student-pdf", (req, res) => {
  console.log(req.files.uploadpdf.mimetype);

  if (req.files.uploadpdf.mimetype == "application/pdf") {
    var type = "pdf";
  } else if (req.files.uploadpdf.mimetype == "video/mp4") {
    var type = "mp4";
  } else {
    var type = "jpg";
  }
  teacherHelper.addNotePdf(req.body, type).then((response) => {
    console.log(response);
    let val = req.files.uploadpdf;
    if (val.mimetype == "application/pdf") {
      val.mv("public/materials/" + response + ".pdf", (err, done) => {
        if (!err) {
          res.render("teacher/uploads", { teacher: true });
        } else {
          res.send("ERROR");
        }
      });
    } else if (val.mimetype == "video/mp4") {
      val.mv("public/materials/" + response + ".mp4", (err, done) => {
        if (!err) {
          res.render("teacher/uploads", { teacher: true });
        } else {
          res.send("ERROR");
        }
      });
    } else {
      val.mv("public/materials/" + response + ".jpg", (err, done) => {
        if (!err) {
          res.render("teacher/uploads", { teacher: true });
        } else {
          res.send("ERROR");
        }
      });
    }
  });
});
//console.log(req.body)
//console.log(req.files)

router.get("/view-uploads", async (req, res) => {
  let Writtenwork = await teacherHelper.getWorks();
  let Pdf = await teacherHelper.getPdf();
  //console.log(Pdf)
  let notepdf = await teacherHelper.getNotePdf();
  //console.log(notepdf)
  let link = await teacherHelper.getNotelink();
  res.render("teacher/view-uploads", {
    teacher: true,
    Writtenwork,
    Pdf,
    notepdf,
    link,
  });
});
router.get("/submitted-work", async (req, res) => {
  students = await teacherHelper.getStudents();
  assignment = await teacherHelper.getAssignment();
  res.render("teacher/show-assignment", {
    student: true,
    students,
    assignment,
  });
});
router.get("/delete-assignment/:id", (req, res) => {
  teacherHelper.deleteAssignment(req.params.id).then(() => {
    res.redirect("/view-uploads");
  });
});
router.get("/delete-pdf/:id", (req, res) => {
  teacherHelper.deletepdf(req.params.id).then(() => {
    res.redirect("/view-uploads");
  });
});
router.get("/delete-notepdf/:id", (req, res) => {
  teacherHelper.deleteNotepdf(req.params.id).then(() => {
    res.redirect("/view-uploads");
  });
});
router.get("/delete-video/:id", (req, res) => {
  teacherHelper.deletevideo(req.params.id).then(() => {
    res.redirect("/view-uploads");
  });
});
router.get("/delete-link/:id", (req, res) => {
  teacherHelper.deletelink(req.params.id).then(() => {
    res.redirect("/view-uploads");
  });
});
router.get("/view-assignment/:id", (req, res) => {
  teacherHelper.viewWorks(req.params.id).then(() => {
    res.redirect("/view-uploads");
  });
});
router.get("/announcement", (req, res) => {
  res.render("teacher/announcements", { teacher: true });
});
router.post("/announcement", (req, res) => {
  if (req.files) {
    if (req.files.head.mimetype == "application/pdf") {
      var type = "pdf";
    } else if (req.files.head.mimetype == "video/mp4") {
      var type = "mp4";
    } else {
      var type = "jpg";
    }
  }
  teacherHelper.addAnnouncement(req.body, type).then((response) => {
    if (req.files) {
      let file = req.files.head;
      if (file.mimetype == "application/pdf") {
        file.mv("public/announcement/" + response + ".pdf", (err, done) => {
          if (!err) {
            res.render("teacher/announcements", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      } else if (file.mimetype == "image/jpeg") {
        file.mv("public/announcement/" + response + ".jpg", (err, done) => {
          if (!err) {
            res.render("teacher/announcements", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      } else {
        file.mv("public/announcement/" + response + ".mp4", (err, done) => {
          if (!err) {
            res.render("teacher/announcements", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      }
    } else {
      res.render("teacher/announcements", { teacher: true });
    }
  });
});
router.get("/viewassignment/:id", async (req, res) => {
  let view = await teacherHelper.getAssignment(req.params.id);

  let details = await teacherHelper.getAttByStudentid(req.params.id);

  let update = await teacherHelper.getUpdate(req.params.id);
  console.log(update);
  res.render("teacher/view-assignment", {
    teacher: true,
    view,
    details,
    update,
  });
});
router.post("/mark-submit", (req, res) => {});
router.get("/student-class", async (req, res) => {
  let video = await teacherHelper.getVideos();
  res.render("teacher/upload-class", { teacher: true, video });
});
router.post("/student-class", (req, res) => {
  teacherHelper.addVideo(req.body).then((response) => {
    let vid = req.files.upload;
    console.log(vid);
    vid.mv("public/video/" + response + ".mp4", (err, done) => {
      if (!err) {
        res.render("teacher/upload-class", { teacher: true });
      } else {
        res.send("ERROR");
      }
    });
  });
});
router.get("/attendance-view", async (req, res) => {
  let date_ob = new Date();
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let date = year + "-" + month + "-" + day;
  let status = await teacherHelper.getStatus();
  res.render("teacher/attendance", { teacher: true, status, date });
});
router.get("/events", (req, res) => {
  res.render("teacher/events", { teacher: true });
});
router.get("/image", (req, res) => {
  res.render("teacher/image");
});

router.post("/multiple-upload", (req, res) => {
  try {
    if (!req.files) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      let data = [];

      //loop all files
      _.forEach(_.keysIn(req.files.photos), (key) => {
        let photo = req.files.photos[key];

        //move photo to uploads directory
        photo.mv("public/multfolder/" + photo.name);

        //push file details
        data.push({
          name: photo.name,
          mimetype: photo.mimetype,
          size: photo.size,
        });
      });

      //return response
      console.log({
        status: true,
        message: "Files are uploaded",
        data: data,
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
  res.render("teacher/events");
});
router.post("/normal-event", (req, res) => {
  if (req.files) {
    if (req.files.event.mimetype == "application/pdf") {
      var type = "pdf";
    } else if (req.files.event.mimetype == "video/mp4") {
      var type = "mp4";
    } else {
      var type = "jpg";
    }
  }
  teacherHelper.addNormal(req.body, type).then((response) => {
    //console.log(file.name)
    if (req.files) {
      let file = req.files.event;
      if (file.mimetype == "application/pdf") {
        file.mv("public/events/" + response + ".pdf", (err, done) => {
          if (!err) {
            res.render("teacher/events", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      } else if (file.mimetype == "video/.mp4") {
        file.mv("public/events/" + response + ".mp4", (err, done) => {
          if (!err) {
            res.render("teacher/events", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      } else {
        file.mv("public/events/" + response + ".png", (err, done) => {
          if (!err) {
            res.render("teacher/events", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      }
    } else {
      res.render("teacher/events", { teacher: true });
    }
  });
});

router.post("/paid-event", (req, res) => {
  if (req.files) {
    if (req.files.event.mimetype == "application/pdf") {
      var type = "pdf";
    } else if (req.files.event.mimetype == "video/mp4") {
      var type = "mp4";
    } else {
      var type = "jpg";
    }
  }

  teacherHelper.addPaid(req.body, type).then((response) => {
    if (req.files) {
      let file = req.files.event;
      if (file.mimetype == "application/pdf") {
        file.mv("public/events/" + response + ".pdf", (err, done) => {
          if (!err) {
            res.render("teacher/events", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      } else if (file.mimetype == "video/mp4") {
        file.mv("public/events/" + response + ".mp4", (err, done) => {
          if (!err) {
            res.render("teacher/events", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      } else {
        file.mv("public/events/" +response+ ".png", (err, done) => {
          if (!err) {
            res.render("teacher/events", { teacher: true });
          } else {
            res.send("ERROR");
          }
        });
      }
    } else {
      res.render("teacher/events", { teacher: true });
    }
  });
});
router.get("/addimage", async (req, res) => {
  let picture = await teacherHelper.getgallery();
  res.render("teacher/photos", { picture, teacher: true });
});
router.get("/upload", (req, res) => {
  res.json({ status: true });
});

router.post("/upload-image", (req, res) => {
  teacherHelper.addgallery(req.body).then((response) => {
    let file = req.files.photos;

    file.mv("public/gallery/" + response + ".png", async (err, done) => {
      if (!err) {
        let picture = await teacherHelper.getgallery();
        res.render("teacher/gallery", { teacher: true, picture });
      } else {
        res.send("ERROR");
      }
    });
  });
});
router.get("/month", async (req, res) => {
  let val = req.query;

  let details = await teacherHelper.getmonth(val);
  console.log(details);
  res.render("teacher/show-months", { teacher: true, details });
});
router.get("/months", async (req, res) => {
  let val = req.query;

  let details = await teacherHelper.getmonths(val);
  console.log(details);
  res.render("teacher/attendance-month", { teacher: true, details });
});
router.post("/upload-img", (req, res) => {
  var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");

  let val = Date.now() + ".png";
  let data = {
    value: val,
  };

  teacherHelper.addgallery(data).then((data) => {
    fs.writeFile("public/upload/" + val, base64Data, "base64", function (err) {
      if (err) {
        console.log(err);
      } else {
        res.json({ status: true });
      }
    });
  });
});
router.get("/testing", (req, res) => {
  res.render("teacher/testing");
});

router.post("/testing", (req, res) => {
  teacherHelper.addtoProgress(req.body).then((response) => {
    let files = req.files.file1;

    files.mv("public/test/" + response + ".png", (err, done) => {
      if (!err) {
        res.redirect("/testing");
      } else {
        res.send("ERROR");
      }
    });
  });
});
router.get("/payment-details", async (req, res) => {
  let events = await teacherHelper.getPayevent();

  res.render("teacher/view-payment", { teacher: true, events });
});
router.get("/watch-payments/:id", async (req, res) => {
  let paytm = await studentHelper.getptm(req.params.id);
  let paypal = await studentHelper.getpapl(req.params.id);
  let raz = await studentHelper.getRaz(req.params.id);

  res.render("teacher/watch-payment", { teacher: true, paytm, paypal, raz });
});
router.post("/find-attendance", async (req, res) => {
  console.log(req.body);
  let d = req.body.date;

  let students = await teacherHelper.findattbydate(req.body);
  res.render("teacher/show-attendance-by-day", { teacher: true, students });
});
router.post("/add-marks",async(req,res)=>{
  let view = await teacherHelper.getAssignment(req.body.student);

    let details = await teacherHelper.getAttByStudentid(req.body.student);
  
    let update = await teacherHelper.getUpdate(req.body.student);
  teacherHelper.assignmentMarks(req.body).then((response)=>{
   
    res.render("teacher/view-assignment",{teacher:true,details,update,view})
  })
})


module.exports = router;
