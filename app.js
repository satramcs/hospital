var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var doctorRouter = require('./routes/doctor');
var specialistRouter = require('./routes/specialist');
var path = require('path');
var flash = require('express-flash');
var session = require('express-session');
var expressValidator = require('express-validator');

global.appRoot = path.resolve(__dirname);
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ 
     secret: 'Test',
     resave: false,
     saveUninitialized: true,
     cookie: { maxAge: 60000 }
 }))

app.use(flash());
// app.use(expressValidator());

// app.use(expressValidator({
// customValidators: {
//     isImage: function(value, filename) {
//         var extension = (path.extname(filename)).toLowerCase();
//         switch (extension) {
//             case '.jpg':
//                 return '.jpg';
//             case '.jpeg':
//                 return '.jpeg';
//             case  '.png':
//                 return '.png';
//             default:
//                 return false;
//         }
//     }
// }}));

app.use('/', indexRouter);
app.use('/doctor', doctorRouter);
app.use('/specialist', specialistRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
