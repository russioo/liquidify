module.exports = {
  apps: [
    {
      name: "liquidify-agent",
      script: "npx",
      args: "tsx src/index.ts",
      cwd: "d:/liquiidyf/agent",
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,
      windowsHide: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
