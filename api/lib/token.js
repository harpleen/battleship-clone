const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

function generateToken(user_id) {
  // 7 days in seconds (7 * 24 * 60 * 60)
  const SEVEN_DAYS_IN_SECS = 604800;
  const issuedAtTime = Math.floor(Date.now() / 1000);
  const expiryTime = issuedAtTime + SEVEN_DAYS_IN_SECS;

  const claims = {
    sub: user_id,
    iat: issuedAtTime,
    exp: expiryTime,
  };

  return JWT.sign(claims, secret);
}

function decodeToken(token) {
  return JWT.decode(token, secret);
}

module.exports = { generateToken, decodeToken };