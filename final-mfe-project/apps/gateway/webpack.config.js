const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const { ModuleFederationPlugin } = require("webpack").container;
const path = require("path");
require("dotenv").config();

module.exports = (_env, argv) => ({
  entry: "./src/index.tsx",
  mode: argv.mode ?? "development",
  devServer: {
    port: process.env.GATEWAY_PORT || 4200,
    historyApiFallback: true,
    hot: true,
    // Same cross-origin fix as the remotes, in case anything else in the
    // system ever needs to fetch an asset from the Gateway across ports.
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
    // Gateway is the Module Federation HOST: it declares remotes by URL
    // (never hardcoded elsewhere) and consumes their exposed modules at
    // runtime — the remotes are NOT copied into this build.
    new ModuleFederationPlugin({
      name: "gateway",
      remotes: {
        mfe_product: `mfe_product@${process.env.REMOTE_PRODUCT_URL || "http://localhost:4201/remoteEntry.js"}`,
        mfe_cart: `mfe_cart@${process.env.REMOTE_CART_URL || "http://localhost:4202/remoteEntry.js"}`,
        mfe_orders: `mfe_orders@${process.env.REMOTE_ORDERS_URL || "http://localhost:4203/remoteEntry.js"}`,
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.2.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.2.0" },
        zustand: { singleton: true },
        "@final-mfe/state": { singleton: true },
        "@final-mfe/events": { singleton: true },
      },
    }),
    new webpack.DefinePlugin({
      "process.env.API_URL": JSON.stringify(process.env.API_URL || "http://localhost:3000/api"),
    }),
    new HtmlWebpackPlugin({ template: "./public/index.html" }),
  ],
  output: { publicPath: "auto" },
});
