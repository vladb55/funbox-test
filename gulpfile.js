"use strict";

/* параметры для gulp-autoprefixer */
var autoprefixerList = [
    'Chrome >= 45',
    'Firefox ESR',
    'Edge >= 12',
    'Explorer >= 10',
    'iOS >= 9',
    'Safari >= 9',
    'Android >= 4.4',
    'Opera >= 30'
];

var path = {
    build: {
        js:         'docs/assets/js/',
        style:      'docs/assets/css/',
        styleLibs:  'docs/assets/css/libs/',
        jsLibs:     'docs/assets/js/libs/',
        img:        'docs/assets/img/',
        fonts:      'docs/assets/fonts/',
        views:      'docs/'
    },
    src: {
        js:         'resources/assets/js/main.js',
        style:      'resources/assets/sass/app.scss',
        styleLibs:  'resources/assets/css/libs/*.css',
        jsLibs:     'resources/assets/js/libs/*.js',
        img:        'resources/assets/img/*.*',
        fonts:      'resources/assets/fonts/**/*.*',
        views:      'resources/views/*.*'
    },
    watch: {
        js:    'resources/assets/js/main.js',
        app:   'resources/assets/js/app.js',
        var:   'resources/assets/sass/variables.scss',
        style: 'resources/assets/sass/app.scss',
        exts: [
                'resources/assets/sass/page/*.*',
        ],
        img:   'resources/assets/img/*.*',
        fonts: 'resources/assets/fonts/**/*.*',
        views: 'resources/views/**'
    },
    clean:     './docs/assets'
};

var config = {
    host: 'http://localhost',
    port: 8080,
    notify: false,
    fallback: 'index.html',
    livereload: true,
    open: true,
    server: './docs'
};

var gulp = require('gulp'),  // подключаем Gulp
    webserver = require('browser-sync'), // сервер для работы и автоматического обновления страниц
    plumber = require('gulp-plumber'), // модуль для отслеживания ошибок
    rigger = require('gulp-rigger'), // модуль для импорта содержимого одного файла в другой
    sourcemaps = require('gulp-sourcemaps'), // модуль для генерации карты исходных файлов
    sass = require('gulp-sass'), // модуль для компиляции SASS (SCSS) в CSS
    autoprefixer = require('gulp-autoprefixer'), // модуль для автоматической установки автопрефиксов
    cleanCSS = require('gulp-clean-css'), // плагин для минимизации CSS
    uglify = require('gulp-uglify'), // модуль для минимизации JavaScript
    cache = require('gulp-cache'), // модуль для кэширования
    imagemin = require('gulp-imagemin'), // плагин для сжатия PNG, JPEG, GIF и SVG изображений
    jpegrecompress = require('imagemin-jpeg-recompress'), // плагин для сжатия jpeg
    pngquant = require('imagemin-pngquant'), // плагин для сжатия png
    fileinclude = require('gulp-file-include'); // плагин для подключения html в html

// emails dependencies
var inky = require('inky'),
    emailBuilder = require('gulp-email-builder');


// сбор стилей
gulp.task('css:build', function () {
    return gulp.src(path.src.style) // получим app.scss
        .pipe(plumber()) // для отслеживания ошибок
        .pipe(sourcemaps.init()) // инициализируем sourcemap
        .pipe(sass()) // scss -> css
        .pipe(autoprefixer({ // добавим префиксы
            browsers: autoprefixerList
        }))
        .pipe(cleanCSS()) // минимизируем CSS
        .pipe(sourcemaps.write('./')) // записываем sourcemap
        .pipe(gulp.dest(path.build.style)); // выгружаем в build
});

// перенос и минификация вендорных библиотек стилей
gulp.task('csslibs:build', function () {
    return gulp.src(path.src.styleLibs)
        .pipe(cleanCSS())
        .pipe(gulp.dest(path.build.styleLibs))
});


// сбор js
gulp.task('js:build', function () {
    return gulp.src(path.src.js) // получим файл app.js
        .pipe(plumber()) // для отслеживания ошибок
        .pipe(rigger()) // импортируем все указанные файлы в main.js
        .pipe(sourcemaps.init()) //инициализируем sourcemap
        .pipe(uglify()) // минимизируем js
        .pipe(sourcemaps.write('./')) //  записываем sourcemap
        .pipe(gulp.dest(path.build.js)) // положим готовый файл
});


//Перенос шрифтов
gulp.task('fonts:build', function() {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

gulp.task('image:build', function () {
    return gulp.src(path.src.img) // путь с исходниками картинок
        .pipe(cache(imagemin([ // сжатие изображений
            imagemin.gifsicle({interlaced: true}),
            jpegrecompress({
                progressive: true,
                max: 90,
                min: 80
            }),
            pngquant(),
            imagemin.svgo({plugins: [{removeViewBox: false}]})
        ])))
        .pipe(gulp.dest(path.build.img)); // выгрузка готовых файлов
});

gulp.task('views:build', function () {
    return gulp.src(path.src.views) // путь с исходниками шаблонов
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest(path.build.views)) // выгрузка готовых файлов
});

// очистка кэша
gulp.task('cache:clear', function () {
    return cache.clearAll();
});

// запуск сервера
gulp.task('webserver', function () {
    webserver(config);
});

gulp.task('build', gulp.series(
    'css:build',
    'csslibs:build',
    'fonts:build',
    'image:build',
    'views:build'
));

gulp.task('watch', function() {
    gulp.watch([path.watch.style,path.watch.var], gulp.series('css:build'));
    gulp.watch(path.watch.js, gulp.series('js:build'));
    gulp.watch(path.watch.img, gulp.series('image:build'));
    gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
    gulp.watch(path.watch.views, gulp.series('views:build'));
    gulp.watch(path.watch.app, gulp.series('js:build'));

    path.watch.exts.forEach(function(file) {
        gulp.watch(file, gulp.series('css:build'));
    });
});

// ------------------------------- Mail settings
// Компиляция scss => css стилей письма
gulp.task('mailStyles', function () {
    return gulp.src('resources/assets/sass/mail/*.*')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('docs/assets/css/mail/'));
});

// Вставка инлайн стилей вместо классов
gulp.task('mailBuilder', function() {
    return gulp.src('resources/views/mail/build/*.blade.php')
        .pipe(emailBuilder().build())
        .pipe(gulp.dest('resources/views/mail/build'));
});

// Компиляция из контейнеров в таблицы
gulp.task('inky', function () {
    return gulp.src('resources/views/mail/src/*.blade.php')
        .pipe(inky())
        .pipe(gulp.dest('resources/views/mail/build'));
});

//WATCH
gulp.task('mailWatch', function () {
    gulp.watch(['resources/assets/sass/mail/*.*', 'resources/views/mail/src/*.blade.php'], gulp.series('mailStyles', 'inky', 'mailBuilder'));
});
// ------------------------------- /Mail settings

// задача по умолчанию
gulp.task('default', gulp.series('build', 'watch'));
