module.exports = {
  apps: [
    {
      name: "liquidify",
      script: "node_modules/next/dist/bin/next",
      args: "dev",
      cwd: "d:/liquiidyf",
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
