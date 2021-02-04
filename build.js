const config = require("./webpack.config");
const webpack = require("./lib/webpack").default;

new webpack(config).run();
