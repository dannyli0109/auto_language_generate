const { src, dest, series } = require("gulp");
const ts = require("gulp-typescript");
const fs = require("fs");
const rimraf = require("rimraf");
const run = require("gulp-run");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const sourcemaps = require("gulp-sourcemaps");
const rollup = require("rollup");
const rollupStream = require("rollup-stream");
const commonjs = require("@rollup/plugin-commonjs");
const { nodeResolve } = require("@rollup/plugin-node-resolve");

const tsFilesGlob = ["src/**/*.ts", "!./node_modules/**/*.ts"];
const workingPaths = ["src/working/**/*"];

function createDirectories() {
  return src("*.*", { read: false })
    .pipe(dest("outputs"))
    .pipe(dest("dist"))
    .pipe(dest("build"));
}

function moveWorkingDirectory() {
  return src(workingPaths).pipe(dest("./dist/working"));
}

function buildTsFiles() {
  const tsconfig = require("./tsconfig.json");
  return src(tsFilesGlob)
    .pipe(ts(tsconfig.compilerOptions))
    .pipe(dest("build"));
}

function bundle() {
  // return rollupStream({
  //   input: "build/index.js",
  //   rollup: rollup,
  //   format: "iife",
  //   plugins: [
  //     nodeResolve({}),
  //     commonjs({
  //       include: ["node_modules/**"],
  //     }),
  //   ],
  // })
  //   .pipe(source("index.js"))
  //   .pipe(buffer())
  //   .pipe(sourcemaps.init({ loadMaps: true }))
  //   .pipe(sourcemaps.write("."))
  return src("build/index.js").pipe(dest("./dist"));
}

function createTsConfig(cb) {
  if (!fs.existsSync("./tsconfig.json")) {
    fs.writeFileSync(
      "./tsconfig.json",
      `{
            "compilerOptions": {
                "module": "ES2015",
                "target": "ES2018",
                "noImplicitAny": true,
                "removeComments": false,
                "preserveConstEnums": true,
                "sourceMap": true,
                "allowJs": true,
                "checkJs": false
            },
            "exclude": [
                "gulpfile.js",
                "dist"
            ]
        }`
    );
  }
  cb();
}

function clean(cb) {
  rimraf.sync("dist");
  rimraf.sync("build");
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
  bundle,
  runProgram
);

exports.default = series(exports.build);
