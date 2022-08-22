const { src, dest, series } = require("gulp");
const ts = require("gulp-typescript");
const fs = require("fs");
const babel = require("gulp-babel");
const rimraf = require("rimraf");
const run = require("gulp-run");

const tsFilesGlob = ["src/**/*.ts", "!./node_modules/**/*.ts"];
const workingPaths = ["src/working/**/*"];

function createDirectories()
{
    return src("*.*", {read: false})
        .pipe(dest("outputs"))
        .pipe(dest("dist"));
}

function moveWorkingDirectory() {
    return src(workingPaths).pipe(dest("./dist/working"));
}

function buildTsFiles() {
    const tsconfig = require("./tsconfig.json");
    return src(tsFilesGlob)
        .pipe(ts(tsconfig.compilerOptions))
        .pipe(dest("dist"));

}

function createTsConfig(cb) {
    if (!fs.existsSync("./tsconfig.json")) {
        fs.writeFileSync(
            "./tsconfig.json",
            `{
                "compilerOptions": {
                    "moduleResolution": "node",
                    "noImplicitAny": true,
                    "removeComments": true,
                    "preserveConstEnums": true,
                    "sourceMap": true,
                    "allowJs": true,
                    "checkJs": false,
                    "typeRoots": [
                        "./src/@types",
                        "./node_modules/@types"
                    ],
                },
                "include": [
                    "src/**/*.ts"
                ],
                "exclude": [
                    "node_modules"
                ]
            }`
        )
    }
    cb();
}

function clean(cb) {
    rimraf.sync("dist");
    rimraf.sync("outputs");
    cb();
}

function runProgram() {
    return run("node dist/index.js").exec();
}

exports.build = series(
    clean,
    createDirectories,
    createTsConfig,
    moveWorkingDirectory,
    buildTsFiles,
    runProgram
)

exports.default = series(
    exports.build
)