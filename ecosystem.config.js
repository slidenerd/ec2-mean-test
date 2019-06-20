module.exports = {
  apps: [{
    name: 'EC2 Mean Test',
    // https://github.com/Unitech/pm2/issues/2528
    script: './bin/www',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // https://futurestud.io/tutorials/pm2-create-multiple-environments-in-process-file-json-js-yaml
    env: {
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://localhost:27017/ec2_mean_test'
    },
    env_development: {
      DEBUG: 'ec2-mean-test:*'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy: {
    production: {
      user: 'node',
      host: '212.83.163.1',
      ref: 'origin/master',
      repo: 'git@github.com:repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
