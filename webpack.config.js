const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
// const webpack = require('webpack');

if (!process.env.TARGET) {
  throw Error("Please specify env var TARGET, 'chrome', 'firefox', or 'safari'.");
} else if (
  !(process.env.TARGET === "chrome" || process.env.TARGET === "firefox" || process.env.TARGET === "safari")
) {
  throw Error("TARGET can only be 'chrome', 'firefox', or 'safari'.");
} else {
  console.info(`\x1b[1;32mBuilding for target ${process.env.TARGET}...\x1b[m`);
}

let config = {
  context: path.resolve(__dirname, "src"),
  entry: {
    options: "./ui/options.js",
    popup: "./ui/popup.js",
    "service-worker": "./content-script/service-worker.js",
  },
  output: {
    path: path.resolve(__dirname, "build", process.env.TARGET),
    filename: "[name].dist.js",
  },
  resolve: {
    modules: [path.resolve(__dirname, "node_modules")],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "./static/", to: "./" },
        { from: "../LICENSE", to: "./" },
        { from: "../_locales/", to: "./_locales" },
        {
          from: `./manifest.${process.env.TARGET}.json`,
          to: `./manifest.json`,
        },
        { from: "../src/lib/openlocationcode.js", to: "./vendor/" },
        {
          from: "../node_modules/open-location-code/LICENSE",
          to: "./vendor/openlocationcode.license.txt",
        },
        {
          from: "../node_modules/bootstrap/dist/css/bootstrap.min.css",
          to: "./vendor/css",
        },
        {
          from: "../node_modules/file-saver/dist/FileSaver.min.js",
          to: "./vendor",
        },
      ],
    }),
    /* new webpack.DefinePlugin({
      'ENVIRONMENT': require(`./src/environment.${process.env.TARGET}.js`)
    }) */
  ],
  devtool: "source-map",
};

module.exports = config;
