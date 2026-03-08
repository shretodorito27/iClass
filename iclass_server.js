const express = require("express")
const path = require("path")
const { MongoClient } = require("mongodb")

const app = express()
const PORT = 8080
const MONGO_URL = "mongodb://127.0.0.1:27017"
const DB_NAME = "iclassDB"
const COLLECTION_NAME = "users"

let usersCollection

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname))

async function connectToMongoDB() {
  const client = new MongoClient(MONGO_URL)
  await client.connect()

  const db = client.db(DB_NAME)
  usersCollection = db.collection(COLLECTION_NAME)

  await usersCollection.createIndex({ email: 1 }, { unique: true })

  console.log("Connected to MongoDB")
}

function isValidSjsuEmail(email) {
  return typeof email === "string" && email.trim().toLowerCase().endsWith("@sjsu.edu")
}

function isValidPassword(password) {
  return typeof password === "string" && password.length > 6
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

app.get("/signin", (req, res) => {
  res.sendFile(path.join(__dirname, "signin.html"))
})

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "signup.html"))
})

app.post("/api/signup", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase()
    const password = req.body.password || ""
    const confirmPassword = req.body.confirmPassword || ""

    if (!isValidSjsuEmail(email)) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Email must end with @sjsu.edu"
      })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        field: "password",
        message: "Password must be longer than 6 characters"
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        field: "confirmPassword",
        message: "The two passwords do not match"
      })
    }

    const existingUser = await usersCollection.findOne({ email })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        field: "email",
        message: "This email is already registered"
      })
    }

    // For demo/class project only.
    // In a real app, store a hashed password instead of plain text.
    await usersCollection.insertOne({
      email,
      password,
      createdAt: new Date()
    })

    return res.json({
      success: true,
      message: "Sign up successful! Redirecting to Sign In page in 3 seconds..."
    })
  } catch (error) {
    console.error("Sign up error:", error)
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during sign up"
    })
  }
})

app.post("/api/signin", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase()
    const password = req.body.password || ""

    if (!isValidSjsuEmail(email)) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Email must end with @sjsu.edu"
      })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        field: "password",
        message: "Password must be longer than 6 characters"
      })
    }

    const user = await usersCollection.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        field: "email",
        message: "This email has not been registered"
      })
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        field: "password",
        message: "Incorrect email or password"
      })
    }

    return res.json({
      success: true,
      message: "Sign in successful!"
    })
  } catch (error) {
    console.error("Sign in error:", error)
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during sign in"
    })
  }
})

connectToMongoDB()
  .then(() => {
    app.listen(PORT, "localhost", () => {
      console.log("Server running localhost:8080/")
    })
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error)
  })
