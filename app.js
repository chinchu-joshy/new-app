var createError = require("http-errors");
var express = require("express");

var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const _ = require("lodash");
//var MongoDBStore = require('connect-mongodb-session')(session);
var teacherRouter = require("./routes/teacher");
var usersRouter = require("./routes/users");
var app = express();
var hbs = require("express-handlebars");
var db = require("./config/connection");
var session = require("express-session");
var fileUpload = require("express-fileupload");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
  })
);
app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(cors());
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));
app.use(
  session({
    name: "session-name",
    resave: false,
    saveUninitialized: false,
    secret: "key",
    cookie: {
      sameSite: true,
      maxAge: 100000000,
    },
  })
);
db.connect((err) => {
  if (err) console.log("connection error" + err);
  else console.log("database connected to port 27017");
});
app.use("/", teacherRouter);
app.use(usersRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
module.exports = app;

