module.exports = {
  apps: [
    {
      name: 'htn-backend',
      script: './dist/main.js',
      max_memory_restart: '300M',
    },
  ],
};
