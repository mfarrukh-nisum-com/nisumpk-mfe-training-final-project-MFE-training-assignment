const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const path = require("path");

module.exports = (_env, argv) => ({
  entry: "./src/index.tsx",
  mode: argv.mode ?? "development",
  devServer: {
    port: process.env.ORDERS_PORT || 4203,
    historyApiFallback: true,
    hot: true,
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
      name: "mfe_orders",
      filename: "remoteEntry.js",
      exposes: { "./OrdersApp": "./src/App" },
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
