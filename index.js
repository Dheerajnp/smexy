const express=require('express');
const app= express();
const dotenv=require('dotenv');
const path=require('path');
const session=require('express-session');
const nocache=require('nocache');
var cookieParser=require('cookie-parser')


 
var adminRouter= require('./routes/admin')
var usersRouter=require('./routes/users')
var cartRouter = require('./routes/cartRoute');

dotenv.config({path:'config.env'})

const PORT=process.env.PORT || 4040;

app.use(session({
    secret:"secret",
    resave:false,
    cookie:{maxAge:1000*60*60*2},
    saveUninitialized:true
}))
app.use(nocache());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//set view engine
app.set("view engine","ejs")
//load assets
app.use('/css',express.static(path.resolve(__dirname,"assets/css")))
// (css/styles.css) to access only virtual path like this in ejs
app.use('/imgs',express.static(path.resolve(__dirname,"assets/imgs")))
app.use('/js',express.static(path.resolve(__dirname,"assets/js")))
app.use('/fonts',express.static(path.resolve(__dirname,"assets/fonts")))
app.use('/uploads',express.static(path.resolve(__dirname,"assets/uploads")))
app.use('/userassets',express.static(path.resolve(__dirname,"assets/Userassets")))
app.use('/assets',express.static(path.resolve(__dirname,"assets")))

app.use('/',usersRouter);
app.use('/admin',adminRouter);
app.use('/home/cart',cartRouter);

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


app.listen(PORT,()=>{
    console.log(`Server running at http://localhost:${PORT}/`)
})


