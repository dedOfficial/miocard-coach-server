export default () => ({
  port: parseInt(process.env.PORT, 10),
  debug: process.env.DEBUG === 'true' ? true : false,
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    name: process.env.ADMIN_NAME,
    password: process.env.ADMIN_PASSWORD,
    key: process.env.API_KEY,
  },
  mb: {
    key: process.env.MB_KEY,
  },
});
