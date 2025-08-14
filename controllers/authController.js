const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const util = require("util");
const nodemailer = require("nodemailer");
const crypto = require("crypto");


const query = util.promisify(db.query).bind(db);

const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Notify" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};


exports.register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please enter all fields" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

        const existingUsers = await query("SELECT * FROM users WHERE email = ?", [email]);

        if (existingUsers.length > 0) {
            const user = existingUsers[0];
            
            if (user.is_verified) {
                return res.status(400).json({ message: "An account with this email already exists and is verified." });
            }
            
            
            await query("UPDATE users SET password = ?, otp = ?, otp_expires = ? WHERE id = ?", [hashedPassword, otp, otpExpires, user.id]);
            
            await sendEmail({
                to: email,
                subject: "Your New OTP for Email Verification",
                text: `Welcome back! Your new One-Time Password (OTP) is: ${otp}. It will expire in 10 minutes.`,
            });
            
            return res.status(200).json({
                message: "Your registration was incomplete. We've sent a new OTP to your email.",
            });

        } else {
            
            await query("INSERT INTO users SET ?", {
                email,
                password: hashedPassword,
                otp,
                otp_expires: otpExpires,
            });

            await sendEmail({
                to: email,
                subject: "Your OTP for Email Verification",
                text: `Welcome! Your One-Time Password (OTP) is: ${otp}. It will expire in 10 minutes.`,
            });

            return res.status(201).json({
                message: "Registration successful! Please check your email for an OTP to verify your account.",
            });
        }

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
};


exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: "Please provide email and OTP." });
    }

    try {
        const users = await query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: "User not found." });
        }

        const user = users[0];

        if (user.otp !== otp || new Date() > new Date(user.otp_expires)) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }


        await query("UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires = NULL WHERE id = ?", [user.id]);

        res.status(200).json({ message: "Email verified successfully! You can now log in." });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        res.status(500).json({ message: "Server error during OTP verification." });
    }
};



exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  try {
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials. Please check your email or register." });
    }

    const user = users[0];

    if (!user.is_verified) {
        return res.status(401).json({ message: "Your email is not verified. Please complete the registration process." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials. Please check your password." });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};


exports.getMe = async (req, res) => {
  
  const user = req.user;
  res.status(200).json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};


exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; 

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Please provide old and new passwords." });
    }

    try {
        const users = await query("SELECT password FROM users WHERE id = ?", [userId]);
        const user = users[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect old password." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, userId]);

        res.status(200).json({ message: "Password changed successfully." });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: "Server error while changing password." });
    }
};
