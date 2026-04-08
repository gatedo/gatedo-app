module.exports = {
  apps: [
    {
      name: 'gatedo-api',
      cwd: '/home/j6c8nny9aemn/public_html/gatedo.com/app',
      script: './dist/src/main.js',

      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      max_memory_restart: '512M',

      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      error_file: '/home/j6c8nny9aemn/.pm2/logs/gatedo-api-error.log',
      out_file: '/home/j6c8nny9aemn/.pm2/logs/gatedo-api-out.log',
      log_file: '/home/j6c8nny9aemn/.pm2/logs/gatedo-api-combined.log',
      time: true,
      merge_logs: true,
    },
  ],
};