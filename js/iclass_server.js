const express = require("express")
const path = require("path")
const { MongoClient } = require("mongodb")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const crypto = require("crypto")

const app = express()
const PORT = 8080
const MONGO_URL = "mongodb://127.0.0.1:27017"
const DB_NAME = "iclassDB"
const COLLECTION_NAME = "users"
const SALT_ROUNDS = 10

const MAIL_USER = process.env.MAIL_USER || "your_email@gmail.com"
const MAIL_PASS = process.env.MAIL_PASS || "your_app_password"
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

let usersCollection

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname))

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS
  }
})

async function connectToMongoDB() {
  const client = new MongoClient(MONGO_URL)
  await client.connect()

  const db = client.db(DB_NAME)
  usersCollection = db.collection(COLLECTION_NAME)

  await usersCollection.createIndex({ email: 1 }, { unique: true })
  await usersCollection.createIndex(
    { verificationToken: 1 },
    { unique: true, sparse: true }
  )

  console.log("Connected to MongoDB")
}

function isValidSjsuEmail(email) {
  return typeof email === "string" && email.trim().toLowerCase().endsWith("@sjsu.edu")
}

function isValidPassword(password) {
  return typeof password === "string" && password.length > 6
}

function createVerificationToken() {
  return crypto.randomBytes(32).toString("hex")
}

async function sendVerificationEmail(email, token) {
  const verifyLink = `${BASE_URL}/api/verify-email?token=${token}`

  const mailOptions = {
    from: `iClass <${MAIL_USER}>`,
    to: email,
    subject: "Verify your iClass account",
    html: `
      <h2>Welcome to iClass</h2>
      <p>Thank you for registering. Please click the button below to verify your email address:</p>
      <p>
        <a href="${verifyLink}" style="display:inline-block;padding:12px 20px;background:#1565d8;color:#ffffff;text-decoration:none;border-radius:4px;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verifyLink}</p>
    `
  }

  await transporter.sendMail(mailOptions)
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '..', "index.html"))
})

app.get("/signIn", (req, res) => {
  res.sendFile(path.join(__dirname,'..', "signIn.html"))
})

app.get("/signUp", (req, res) => {
  res.sendFile(path.join(__dirname, '..',"signUp.html"))
})

app.get("/signInSuccess", (req, res) => {
  res.sendFile(path.join(__dirname, '..', "signInSuccess.html"))
})

app.get("/api/verify-email", async (req, res) => {
  try {
    const token = req.query.token || ""

    if (!token) {
      return res.status(400).send(`
        <h2>Verification failed</h2>
        <p>Missing verification token.</p>
      `)
    }

    const user = await usersCollection.findOne({ verificationToken: token })

    if (!user) {
      return res.status(400).send(`
        <h2>Verification failed</h2>
        <p>This verification link is invalid or has already been used.</p>
      `)
    }

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          verifiedAt: new Date()
        },
        $unset: {
          verificationToken: ""
        }
      }
    )

    return res.send(`
      <h2>Email verified successfully</h2>
      <p>Your iClass account is now active.</p>
      <p><a href="/signIn.html">Go to Sign In</a></p>
    `)
  } catch (error) {
    console.error("Email verification error:", error)
    return res.status(500).send(`
      <h2>Verification failed</h2>
      <p>An unexpected error occurred during email verification.</p>
    `)
  }
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

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
    const verificationToken = createVerificationToken()

    await usersCollection.insertOne({
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      createdAt: new Date()
    })

    await sendVerificationEmail(email, verificationToken)

    return res.json({
      success: true,
      message: "Sign up successful! Please check your email and verify your account before signing in."
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

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        field: "email",
        message: "Please verify your email before signing in"
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if (!isPasswordCorrect) {
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
    app.listen(PORT, "0.0.0.0", () => {
      console.log("Server running localhost:8080/")
      console.log(`BASE_URL for email verification: ${BASE_URL}`)
    })
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error)
  })
