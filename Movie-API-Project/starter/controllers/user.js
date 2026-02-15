const User = require("../models/User");

// Returns minimal user info (no password/email).
// No auth required.
const getPublicUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("username profilePic");
    if (!user) {
      return res.status(404).json({ message: "No user found" });
    }
    res.json(user);
  } catch (error) {
    console.error("getPublicUser error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { getPublicUser };
