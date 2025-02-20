module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "no-unused-vars": "off", // turned off as it's handled by @typescript-eslint/no-unused-vars
    "@typescript-eslint/no-unused-imports": "error",
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
};
