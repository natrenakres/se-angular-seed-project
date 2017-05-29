var gulp            = require('gulp');
var templateCache   = require('gulp-angular-templatecache');
var uglify          = require('gulp-uglify');
var notify          = require('gulp-notify');
var browserify      = require('browserify');
var babelify        = require('babelify');
var ngAnnotate      = require('browserify-ngannotate');
var browserSync     = require('browser-sync').create();
var rename          = require('gulp-rename');
var mege            = require('merge-stream');
var sourcemap       = require('gulp-sourcemaps');
var source          = require('vinyl-source-stream');
var argv            = require('yargs').argv;

var jsFiles     = "src/js/**/*.js";
var viewFiles   = "src/js/**/*.html";

gulp.task("browserify", ['views'], function () {
    var isDevelopment = getEnv();

    return browserify({
            entries: './src/js/app.js',
            debug:isDevelopment
        }).transform(babelify, {presets:['es2015']})
        .transform(ngAnnotate)
        .bundle()
        .on("error", interceptErrors)
        .pipe(source('main.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('data', function () {
    return gulp.src('./src/data/**/*.json')
        .pipe(gulp.dest('./build/data/'));
})

gulp.task('style', function () {
    return gulp.src('src/css/*.css')
        .pipe(gulp.dest('./build/css/'));
});
gulp.task('img', function () {
    return gulp.src('./src/img/**/*.{png,svg,jpg}')
        .pipe(gulp.dest('./build/img/'));
});


gulp.task('html', ['style', 'img'], function () {
    return gulp.src("src/index.html")
        .on('error', interceptErrors)
        .pipe(gulp.dest('./build/'));
});

gulp.task('views', ['data'], function () {
    return gulp.src(viewFiles)
        .pipe(templateCache({
            standalone:true
        }))
        .on('error', interceptErrors)
        .pipe(rename("app.templates.js"))
        .pipe(gulp.dest('./src/js/config/'));
});


//BUILD
gulp.task("build", ['html', 'browserify'], function () {

    var html = gulp.src("build/index.html")
        .pipe(gulp.dest("./dist/"));

    var js = gulp.src("build/main.js")
        .pipe(uglify())
        .pipe(gulp.dest("./dist/"));

    return merge(html, js);
});

gulp.task('default', ['html', 'browserify'], function () {
    browserSync.init(['./build/**/**.**'], {
        server:"./build",
        port:4000,
        notify:false,
        ui:{
            port:4001
        }
    });

    gulp.watch("src/index.html", ["html"]);
    gulp.watch(viewFiles, ['views']);
    gulp.watch(jsFiles, ["browserify"]);

});

// FUNCTIONS

var interceptErrors = function (error) {
    var args = Array.prototype.slice.call(arguments);

    notify.onError({
        title : "Compile Error",
        message: "<%= error.message %>"
    }).apply(this, args);

    this.emit('end');
};

// get Enviroment varaible for browserify debug true or false
var getEnv = function () {
    if(argv.env){
        if(argv.env === 'prod'){
            console.log('Enviroment is production');
            return false;
        }
    }

    console.log('Enviroment is development');
    return true;
};