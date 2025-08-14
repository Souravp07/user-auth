const jwt = require("jsonwebtoken");
const db = require("../config/db");
const util = require("util");

const query = util.promisify(db.query).bind(db);

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      
      token = req.headers.authorization.split(" ")[1];

      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      
      const users = await query(
        "SELECT id, email, role FROM users WHERE id = ?",
        [decoded.id]
      );

      if (users.length === 0) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }
      
      
      req.user = users[0];
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
