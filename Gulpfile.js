const path = require("path");
const fs = require("fs-extra");
const gulp = require("gulp");
const gutil = require("gulp-util");
const webpack = require("webpack");
const watch = require("gulp-watch");
const sequence = require("gulp-sequence");
const del = require("del");

const banner = (color, banner) => gutil.colors[color || "cyan"](banner ? `[${banner}]` : "[GULP]");

const pkg = require("./package.json");

// Set paths for our project folder

const projectPath = pkg.widget.path ? path.resolve(pkg.widget.path) + "/" : false;
const widgetsFolder = projectPath ? path.join(projectPath, `/widgets/`) : false;
const deploymentFolder = projectPath ? path.join(projectPath, `/deployment/web/widgets/`) : false;

// Check if project folder exists and is accessible

let stat = null;
if (!projectPath) {
    gutil.log(`${banner()} No testproject defined, only copying files to dist/build folder. Set project path in ${gutil.colors.cyan("widget.path")} in ${gutil.colors.magenta("package.json")}`);
} else {
    gutil.log(`${banner()} Testproject defined: ${gutil.colors.magenta(projectPath)}`);
    try {
        stat = projectPath ? fs.statSync(projectPath) : null;
    } catch (e) {
        gutil.log(`${banner("red")} Error getting project directory:`, e.toString());
        gutil.log(`${banner("red")} Copying to the project directory has been disabled`);
        stat = null;
    }
}

// Helper functions

const runWebpack = (callback) => {
    webpack(require("./webpack.config.js"), function (err, stats) {
        if (err) throw new gutil.PluginError("webpack", err);
        gutil.log(
            banner("cyan", "WEBPACK"),
            stats.toString({
                colors: true,
                modules: false,
            })
        );
        callback && callback();
    });
};

const copyFile = (paths) => {
    try {
        fs.copySync(paths.src, paths.dest);
    } catch (err) {
        gutil.log(`${banner("red")} Copy fail`, err);
    }
};

const getPaths = (file, srcFolder, destFolder) => {
    return {
        src: path.join(__dirname, srcFolder, file.relative),
        dest: path.join(destFolder, file.relative),
    };
};

// Base tasks
const watchSrc = () => {
    return watch(
        "src/**/*",
        {
            verbose: true,
        },
        () => {
            runWebpack();
        }
    );
};

const watchBuild = () => {
    return watch(
        "build/**/*",
        {
            verbose: stat !== null,
            read: false,
        },
        (file) => {
            if (stat !== null) {
                const paths = getPaths(file, "build", deploymentFolder);
                if (paths.src.indexOf("package.xml") !== -1) {
                    return;
                }
                copyFile(paths);
            }
        }
    );
};

const watchDist = () => {
    return watch(
        `dist/${pkg.widget.package}.mpk`,
        {
            verbose: stat !== null,
            read: false,
        },
        (file) => {
            if (stat !== null) {
                const paths = getPaths(file, "dist", widgetsFolder);
                copyFile(paths);
            }
        }
    );
};

const clean = () => del(["dist", "build"], { force: true });
const buildDist = (callback) => runWebpack(callback);
const dev = gulp.series(watchSrc, watchBuild, watchDist);
const build = gulp.series(clean, buildDist);
exports.build = build;
exports.default = dev;
