module.exports = {
  apps: [
    {
      name: 'intentloop-api',
      cwd: '/var/www/idea/new/server',
      script: 'node',
      args: 'dist/main.js',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
