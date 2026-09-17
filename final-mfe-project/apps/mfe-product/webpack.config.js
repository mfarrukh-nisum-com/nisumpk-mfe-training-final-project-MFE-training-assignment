const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const path = require("path");

module.exports = (_env, argv) => ({
  entry: "./src/index.tsx",
  mode: argv.mode ?? "development",
  devServer: {
    port: process.env.PRODUCT_PORT || 4201,
    historyApiFallback: true,
    hot: true,
    // webpack-dev-server v5 sends `Cross-Origin-Resource-Policy: same-origin`
    // by default, which blocks the Gateway (a different origin/port) from
    // fetching remoteEntry.js — this is required for Module Federation
    // across ports to work at all.
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@final-mfe/shared-types": path.resolve(__dirname, "../../libs/shared-types/src"),
      "@final-mfe/shared-ui": path.resolve(__dirname, "../../libs/shared-ui/src"),
      "@final-mfe/state": path.resolve(__dirname, "../../libs/state/src"),
      "@final-mfe/events": path.resolve(__dirname, "../../libs/events/src"),
      "@final-mfe/utilities": path.resolve(__dirname, "../../libs/utilities/src"),
    },
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: ["style-loader", "css-loader", "postcss-loader"] },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "mfe_product",
      filename: "remoteEntry.js",
      // Expose the page-level component only — internal pieces (hooks,
      // helpers) stay private to this MFE. This is the runtime-loadable
      // module the Gateway pulls in.
      exposes: { "./ProductListApp": "./src/App" },
      shared: {
        react: { singleton: true, requiredVersion: "^18.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.2.0" },
        zustand: { singleton: true },
        "@final-mfe/state": { singleton: true },
        "@final-mfe/events": { singleton: true },
      },
    }),
    new HtmlWebpackPlugin({ template: "./public/index.html" }),
  ],
  output: { publicPath: "auto" },
});
