module.exports = {
  development: {
    username: "postgres",
    password: "1234",
    database: "ex_mutex",
    host: "127.0.0.1",
    port: 5431,
    dialect: "postgres",
    pool: {
      max: 30,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
