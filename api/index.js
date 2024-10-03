const express = require("express");
const mongoose = require("mongoose");
const app = express();
const dotenv = require("dotenv");
// for cookies work and authentication
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
// for websocket work
const ws = require("ws");
// models require
const User = require("./model/User.js");
const MessageModel = require("./model/Message.js");
const fs = require("fs");
const path = require("path");

dotenv.config();
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(cookieParser());
app.use(express.json()); // Add body parser
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL, // Ensure CLIENT_URL is defined in .env
  })
);
//consoling things
// console.log(process.env.JWT_SECRET_KEY)
// console.log(process.env.MONGODB_URL)
// console.log(process.env.PORT)
// console.log(process.env.CLIENT_URL)
//function for getting our user

async function getUserDataFromtokenRequest(req) {
  return new Promise((resolve, reject) => {
    // Retrieve the token from cookies
    const token = req.cookies?.token;
    if (!token) {
      return res
        .status(401)
        .json({ msg: "Something went wrong, no token found" });
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, {}, (err, userData) => {
      if (err) {
        // If token verification fails, return an error
        return res.status(403).json({ msg: "Invalid or expired token" });
      }

      // console.log("info of user from the function", userData);
      // If token is valid,. return the decoded user data
      resolve(userData);
    });
  });
}

app.get("/text", (req, res) => {
  res.send("Hello, World!");
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;

  // Extract our user's data from the request token
  const userData = await getUserDataFromtokenRequest(req);
  const ourUserId = userData.id;
  // console.log("full data of ourUser",userData)
  // console.log("userId of ourUser",ourUserId)
  // console.log("recevier userId",userId)

  try {
    // Query for messages where the sender or recipient is either the provided userId or ourUserId
    const messages = await MessageModel.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });

    // Send the messages as a response
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ msg: "Error fetching messages" });
  }
});

// for finding all people and grabing there data without any condtion
app.get("/people", async (req, res) => {
  const allUsers = await User.find({}, { _id: 1, username: 1 });
  res.json(allUsers);
});

// profile
app.get("/profile", (req, res) => {
  // Retrieve the token from cookies
  const token = req.cookies?.token;

  // If no token is found, return an unauthorized status
  if (!token) {
    return res.status(401).json({ msg: "Please login to access this" });
  }

  // Verify the JWT token
  jwt.verify(token, process.env.JWT_SECRET_KEY, {}, (err, decoded) => {
    if (err) {
      // If token verification fails, return an error
      return res.status(403).json({ msg: "Invalid or expired token" });
    }

    // If token is valid, return the decoded user data
    res.status(200).json({ userdata: decoded });
  });
});
// login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const foundUser = await User.findOne({ username });
    if (!foundUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: foundUser._id, username: foundUser.username },
      process.env.JWT_SECRET_KEY
    );

    // Set the token in an HTTP-only cookie
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .json({
        id: foundUser._id,
        username: foundUser.username,
      });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ msg: "Error logging in" });
  }
});
//register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  try {
    // Check if user already exists
    const alreadyUser = await User.findOne({ username });
    if (alreadyUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create a new user
    const createdUser = await User.create({
      username,
      password: hashedPassword,
    });

    // Sign the JWT token
    jwt.sign(
      { userId: createdUser._id, username },
      process.env.JWT_SECRET_KEY,
      (err, token) => {
        if (err) {
          return res.status(500).json({ message: "Error signing token" });
        }
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
          })
          .status(201)
          .json({ message: "ok cookie created", id: createdUser._id });
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Internal server error, something went wrong" });
  }
});

/// logOut code
app.post("/logout", (req, res) => {
  res.clearCookie("token").json("User logout");
});


const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    const server = app.listen(PORT, () =>
      console.log(`Server is running on ${PORT}`)
    );

    const wss = new ws.WebSocketServer({ server });

    wss.on("connection", (connection, req) => {
      function notifyAboutOnlinePeople() {
        [...wss.clients].forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(
              JSON.stringify({
                online: [...wss.clients].map((connectedClient) => ({
                  userId: connectedClient.userId,
                  username: connectedClient.username,
                })),
              })
            );
          }
        });
      }

      connection.isAlive = true;
      connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
          connection.isAlive = false;
          clearInterval(connection.timer);
          connection.terminate();
          notifyAboutOnlinePeople();
          console.log("Client disconnected");
        }, 700);
      }, 2000);

      connection.on("pong", () => {
        clearTimeout(connection.deathTimer);
      });

      // Read username and id from the cookie from this connection
      const cookies = req.headers.cookie;
      if (!cookies) {
        return connection.send("Unauthorized");
      }

      const tokenCookie = cookies
        .split(";")
        .find((str) => str.trim().startsWith("token="));
      if (!tokenCookie) {
        console.log("No token cookie found");
        return connection.send("No token cookie found, something is wrong");
      }

      const token = tokenCookie.split("=")[1];
      if (!token) {
        console.log("No token found");
        return connection.send("No token found");
      }

      jwt.verify(token, process.env.JWT_SECRET_KEY, {}, (err, userdata) => {
        if (err) {
          console.log("Error verifying token", err);
          return connection.send("Token verification failed");
        }

        const { id, username } = userdata;
        connection.userId = id; // Attach user ID to connection
        connection.username = username; // Attach username to connection

        notifyAboutOnlinePeople();

        // Checking for any message received from the frontend
        connection.on("message", async (message) => {
          const testMessageData = JSON.parse(message.toString());
          const { recipient, text, file } = testMessageData;
          console.log(recipient);

          // Find the user by ID (recipient)
          try {
            const user = await User.findById(recipient);
            if (!user) {
              console.log("User not found");
              return;
            }
            const recevierUsername = user.username; // Get the receiver's username
            console.log("Found user:", recevierUsername);

            let filename = null;
            if (file && file.fileData) {
              console.log(file);
              // Check if the fileData starts with 'data:' and contains a comma
              if (
                file.fileData.startsWith("data:") &&
                file.fileData.includes(",")
              ) {
                // Create buffer from base64-encoded data
                const base64Data = file.fileData.split(",")[1]; // Get the actual base64 part
                const bufferData = Buffer.from(base64Data, "base64");

                // Now you can use bufferData to save the file
                const parts = file.name.split(".");
                const fileExtension = parts[parts.length - 1].toLowerCase();
                filename = Date.now() + "." + fileExtension;
                const path = __dirname + "/uploads/" + filename;

                fs.writeFile(path, bufferData, (err) => {
                  if (err) {
                    console.error("Error writing file:", err);
                  } else {
                    console.log("File uploaded:", path);
                  }
                });
              } else {
                console.error("Invalid fileData format");
              }
            } else {
              console.error("No file data provided");
            }

            if (recipient && (text || file)) {
              const messageDocument = await MessageModel.create({
                sender: connection.userId,
                recipient: recipient,
                text: text,
                file: file ? filename : null,
              });

              [...wss.clients]
                .filter((userClient) => userClient.userId === recipient)
                .forEach((userClient) =>
                  userClient.send(
                    JSON.stringify({
                      file: file ? filename : null,
                      text,
                      sender: connection.userId,
                      _id: messageDocument._id,
                      senderUsername: connection.username,
                      recipient,
                      recevierUsername: recevierUsername, // Include the receiver's username
                    })
                  )
                );
            }
          } catch (err) {
            console.error("Error finding user:", err);
          }
        });
      });
    });
  })
  .catch((error) => console.error("MongoDB connection error:", error));
