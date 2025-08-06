module.exports = {
  apps: [
    {
      name: 'sukito-nextjs',
      script: 'npm',
      args: 'start',
      cwd: '/home/ubuntu/sukito',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'sukito-api',
      script: 'server/app.js',
      cwd: '/home/ubuntu/sukito',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/ubuntu/.pm2/logs/sukito-api-error.log',
      out_file: '/home/ubuntu/.pm2/logs/sukito-api-out.log'
    }
  ]
}; 