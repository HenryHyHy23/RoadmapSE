module.exports = [
  {
    ignores: [
      "node_modules/**",
      "public/data/**",
      "src/data/**",
      "data/**",
    ],
  },
  {
    files: ["server.js", "src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
];
