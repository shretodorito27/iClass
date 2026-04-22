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
const USERS_COLLECTION_NAME = "users"
const RESERVATIONS_COLLECTION_NAME = "reservations"
const SALT_ROUNDS = 10

const MAIL_USER = process.env.MAIL_USER || "your_email@gmail.com"
const MAIL_PASS = process.env.MAIL_PASS || "your_app_password"
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

let usersCollection
let reservationsCollection

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "..")))

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
  usersCollection = db.collection(USERS_COLLECTION_NAME)
  reservationsCollection = db.collection(RESERVATIONS_COLLECTION_NAME)

  await usersCollection.createIndex({ email: 1 }, { unique: true })
  await usersCollection.createIndex(
    { verificationToken: 1 },
    { unique: true, sparse: true }
  )

  await reservationsCollection.createIndex(
    { confirmationToken: 1 },
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

function createReservationToken() {
  return crypto.randomBytes(32).toString("hex")
}

function isValidReservationTime(date, start, end) {
  if (!date || !start || !end) {
    return false
  }

  const startDateTime = new Date(`${date}T${start}:00`)
  const endDateTime = new Date(`${date}T${end}:00`)
  const now = new Date()

  if (
    Number.isNaN(startDateTime.getTime()) ||
    Number.isNaN(endDateTime.getTime())
  ) {
    return false
  }

  if (startDateTime >= endDateTime) {
    return false
  }

  if (startDateTime < now) {
    return false
  }

  return true
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

async function sendReservationConfirmationEmail(email, token) {
  const confirmLink = `${BASE_URL}/api/confirm-reservation?token=${token}`

  const mailOptions = {
    from: `iClass <${MAIL_USER}>`,
    to: email,
    subject: "Confirm your iClass reservation",
    html: `
      <h2>Reservation Confirmation Required</h2>
      <p>Please confirm your classroom reservation by clicking the button below:</p>
      <p>
        <a href="${confirmLink}" style="display:inline-block;padding:12px 20px;background:#1565d8;color:#ffffff;text-decoration:none;border-radius:4px;">
          Confirm Reservation
        </a>
      </p>
      <p>If you did not make this request, you can ignore this email.</p>
      <p>${confirmLink}</p>
    `
  }

  await transporter.sendMail(mailOptions)
}

function getReservationDateTime(date, time) {
  return new Date(`${date}T${time}:00`)
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"))
})

app.get("/signIn", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "signIn.html"))
})

app.get("/signUp", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "signUp.html"))
})

app.get("/signInSuccess", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "signInSuccess.html"))
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

app.post("/api/reservations", async (req, res) => {
  try {
    const name = (req.body.name || "").trim()
    const email = (req.body.email || "").trim().toLowerCase()
    const studentId = (req.body.studentId || "").trim()
    const room = (req.body.room || "").trim()
    const date = (req.body.date || "").trim()
    const start = (req.body.start || "").trim()
    const end = (req.body.end || "").trim()

    if (!name || !email || !room || !date || !start || !end) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields."
      })
    }

    if (!isValidSjsuEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email must end with @sjsu.edu"
      })
    }

    if (!isValidReservationTime(date, start, end)) {
      return res.status(400).json({
        success: false,
        message: "You cannot reserve a past time or use an invalid time range."
      })
    }

    const existingConfirmedReservation = await reservationsCollection.findOne({
      email,
      status: "confirmed"
    })

    if (existingConfirmedReservation) {
      return res.status(409).json({
        success: false,
        message: "You already have a current confirmed reservation."
      })
    }

    const existingPendingReservation = await reservationsCollection.findOne({
      email,
      status: "pending"
    })

    if (existingPendingReservation) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending reservation confirmation in your email."
      })
    }

    const confirmationToken = createReservationToken()

    await reservationsCollection.insertOne({
      name,
      email,
      studentId,
      room,
      date,
      start,
      end,
      status: "pending",
      confirmationToken,
      createdAt: new Date(),
      confirmedAt: null,
      cancelledAt: null,
      attendedAt: null
    })

    await sendReservationConfirmationEmail(email, confirmationToken)

    return res.json({
      success: true,
      message: "Reservation request submitted. Please check your email to confirm."
    })
  } catch (error) {
    console.error("Reservation request error:", error)
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while creating the reservation."
    })
  }
})

app.get("/api/confirm-reservation", async (req, res) => {
  try {
    const token = req.query.token || ""

    if (!token) {
      return res.status(400).send(`
        <h2>Reservation confirmation failed</h2>
        <p>Missing reservation confirmation token.</p>
      `)
    }

    const reservation = await reservationsCollection.findOne({
      confirmationToken: token,
      status: "pending"
    })

    if (!reservation) {
      return res.status(400).send(`
        <h2>Reservation confirmation failed</h2>
        <p>This confirmation link is invalid or has already been used.</p>
      `)
    }

    await reservationsCollection.updateOne(
      { _id: reservation._id },
      {
        $set: {
          status: "confirmed",
          confirmedAt: new Date()
        },
        $unset: {
          confirmationToken: ""
        }
      }
    )

    return res.send(`
      <h2>Reservation confirmed successfully</h2>
      <p>Your reservation has been confirmed and will now appear in My Profile.</p>
      <p><a href="/myProfile.html">Go to My Profile</a></p>
    `)
  } catch (error) {
    console.error("Reservation confirmation error:", error)
    return res.status(500).send(`
      <h2>Reservation confirmation failed</h2>
      <p>An unexpected error occurred.</p>
    `)
  }
})

app.get("/api/my-reservation", async (req, res) => {
  try {
    const email = (req.query.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      })
    }

    const reservation = await reservationsCollection.findOne(
      {
        email,
        status: "confirmed"
      },
      {
        sort: { date: 1, start: 1 }
      }
    )

    return res.json({
      success: true,
      reservation: reservation || null
    })
  } catch (error) {
    console.error("Get current reservation error:", error)
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while loading the current reservation."
    })
  }
})

app.get("/api/reservation-history", async (req, res) => {
  try {
    const email = (req.query.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      })
    }

    const history = await reservationsCollection
      .find({
        email,
        status: { $in: ["cancelled", "attended"] }
      })
      .sort({ createdAt: -1 })
      .toArray()

    return res.json({
      success: true,
      history
    })
  } catch (error) {
    console.error("Get reservation history error:", error)
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while loading reservation history."
    })
  }
})

app.post("/api/cancel-reservation", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      })
    }

    const reservation = await reservationsCollection.findOne({
      email,
      status: "confirmed"
    })

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "No current confirmed reservation found."
      })
    }

    await reservationsCollection.updateOne(
      { _id: reservation._id },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date()
        }
      }
    )

    return res.json({
      success: true,
      message: "Reservation cancelled successfully."
    })
  } catch (error) {
    console.error("Cancel reservation error:", error)
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while cancelling the reservation."
    })
  }
})

app.post("/api/mark-attended", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      })
    }

    const reservation = await reservationsCollection.findOne({
      email,
      status: "confirmed"
    })

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "No current confirmed reservation found."
      })
    }

    await reservationsCollection.updateOne(
      { _id: reservation._id },
      {
        $set: {
          status: "attended",
          attendedAt: new Date()
        }
      }
    )

    return res.json({
      success: true,
      message: "Reservation marked as attended."
    })
  } catch (error) {
    console.error("Mark attended error:", error)
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while updating the reservation."
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