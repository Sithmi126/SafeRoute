const bcrypt = require("bcryptjs");

const password = "Admin@SafeRoute2026";
const hash =
  "$2b$10$8DYdGjqiCtUgASZw/KqSwOnjchpqosQ7bNKMMIyCcwMMzsELkXTxm";

bcrypt.compare(password, hash).then((result) => {
  console.log("Password match:", result);
  process.exit(0);
});