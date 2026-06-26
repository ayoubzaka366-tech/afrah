module.exports = {
  apps: [{
    name: 'afrah-backend',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      JWT_SECRET: 'afrah_jwt_secret_2026',
    },
  }],
};
