module.exports = {
  apps: [
    {
      name: 'intentloop-api',
      cwd: '/var/www/intentloop/server',
      script: 'npm',
      args: 'run start:prod',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
