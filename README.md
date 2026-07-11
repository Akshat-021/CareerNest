# Aura: AI-Powered Course Recommendation & Mentorship Portal

Aura is a modern SaaS-quality educational ecosystem built on the **MERN Stack** (MongoDB, Express, React, Node) with **Vite** and **Tailwind CSS**. It combines Artificial Intelligence core services, 1-on-1 expert mentorship slots, structured study roadmap timelines, resume ATS evaluations, and real-time Socket.IO direct messaging.

---

## 🌟 Key Features

* **AI Course Recommendations**: Analyzes academic metrics (CGPA, branch, semester), learning styles, budget constraints, and career goals to recommend relevant courses.
* **AI Career Roadmaps**: Generates custom timelines with weekly tasks, practice problems, milestones, and mock interview prompts (Web Dev, AI, Cloud, Cybersecurity, DevOps, Blockchain, UI/UX).
* **AI Resume ATS Reviewer**: Evaluates resume PDFs/Docs to compute ATS compatibility scores, missing keywords, and suggest enhancements in Google's X-Y-Z formula.
* **AI Quiz Generator**: Creates 4-question topic-specific quizzes with instant explanations, awarding points to update student leaderboard rankings.
* **Placement Probability Predictor**: Estimates placement readiness using a weighted metric algorithm, suggesting steps to fill key skill gaps.
* **1-on-1 Mentorship Booking**: Search verified industry leaders by expertise, check ratings, and book Google Meet consultation slots.
* **Socket.IO Chat System**: Multi-stage direct message streams with typing indicators, online status dots, and mock attachment support.
* **QR-Certified Certificates**: Issue parchment-style completion certificates with secure verification links lookup.
* **Discussion Forum**: Community board for students and mentors to ask questions, like, and reply to posts.

---

## 📂 Architecture & Folder Structure

```
├── client/
│   ├── src/
│   │   ├── assets/       # Media graphics
│   │   ├── components/   # Reusable UI cards
│   │   ├── context/      # Theme, Auth, Socket contexts
│   │   ├── layouts/      # Dashboard and Sidebar wrappers
│   │   ├── pages/        # Dashboard panels, Chat rooms, Landing Page
│   │   ├── services/     # Axios interceptor configurations
│   │   ├── main.jsx      # React launcher entry
│   │   └── index.css     # Tailwind rules + Glassmorphism sheets
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── config/           # DB connection, Cloudinary, NodeMailer, Sockets
│   ├── controllers/      # Auth, Courses, Mentors, AI, Platform controllers
│   ├── middleware/       # JWT auth, error handles, multer uploads
│   ├── models/           # User, Course, Session, Message, Quiz Mongoose schemas
│   ├── routes/           # Auth, Courses, Mentors, AI, Platform routes
│   ├── scripts/          # Database seeding scripts
│   ├── services/         # Gemini API + local simulation fallbacks
│   ├── tests/            # Automated API testing scripts
│   ├── uploads/          # Local static files storage
│   ├── server.js         # Express main application launcher
│   └── .env              # Environment configurations
```

---

## 🚀 Installation & Local Setup

### Prerequisites
* **Node.js** (v18.x or higher)
* **MongoDB** (Local Community Edition or Atlas URI)

### 1. Configure the Backend

Navigate to the `server/` directory, install packages, and set up your `.env`:
```bash
cd server
npm install
```

Create a `.env` file inside `server/` and fill in the following parameters:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai-mentor-portal
JWT_SECRET=supersecretjwtkeyforauthentication123!
JWT_REFRESH_SECRET=supersecretjwtrefreshkeyforauthentication456!

# (Optional) Nodemailer Config
EMAIL_USER=developer@example.com
EMAIL_PASS=demopassword123

# (Optional) Google Gemini API Key - if blank, local AI fallback simulation runs
GEMINI_API_KEY=

# (Optional) Cloudinary Credentials - if blank, uploads fallback to server uploads/ directory
CLOUDINARY_CLOUD_NAME=demo_cloud
CLOUDINARY_API_KEY=demo_key
CLOUDINARY_API_SECRET=demo_secret

CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 2. Seed the Database
Run the pre-configured seed script to wipe the database and insert default accounts, courses, and challenges:
```bash
npm run seed
```
**Login credentials seeded:**
* **Student:** `alex@student.com` | `password123`
* **Mentor:** `sarah@mentor.com` | `password123`
* **Admin:** `admin@portal.com` | `password123`

### 3. Start Backend Server
```bash
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 4. Configure the Frontend

Open a new terminal, navigate to the `client/` folder, install packages, and launch Vite:
```bash
cd client
npm install
npm run dev
```
The frontend portal runs on `http://localhost:5173`. Open it in your browser!

---

## 🧪 Running Automated Tests
Run automated API checks testing server base status, login verification, public course directories, and AI calculations:
```bash
cd server
npm run test
```

---

## 📋 Core REST API Endpoints

### Authentication (`/api/auth`)
* `POST /register` - Register a new User account.
* `POST /verify-otp` - Verify email OTP code.
* `POST /login` - Login, fetch access/refresh tokens, and sync streaks.
* `POST /refresh` - Verify refresh token and fetch new access token.
* `PUT /profile` - Update user bio, avatar pictures, and student settings (Multer multipart enabled).
* `POST /logout` - Clear user tokens.

### Mentorship (`/api/mentors`)
* `GET /` - Retrieve all approved mentors (supports search and expertise tags filter).
* `POST /book` - Student books a slot session with a mentor.
* `GET /sessions` - Retrieve booked meetings (returns relevant list based on user role).
* `PUT /sessions/:id` - Mentors approve (generates video link), reject, complete, or reschedule bookings.
* `POST /sessions/:id/review` - Student reviews completed session.

### AI Engine Services (`/api/ai`)
* `POST /recommend` - Fetch personalized course suggestions based on CGPA and goals.
* `POST /roadmap` - Build a custom learning roadmap and save to DB.
* `POST /chat` - Conversational career chat assistant queries.
* `POST /resume` - Scans resume file to compute ATS compatibility details.
* `POST /gap-analysis` - Compares current skills to target roles to determine study gaps.
* `POST /interview` - Conducts mock technical interview rounds.
* `POST /quiz` - Generates course quiz.
* `GET /predict` - Placement likelihood readiness percentage indicator.

### Platform Portal (`/api/platform`)
* `GET /challenges` - Get coding questions.
* `POST /challenges/submit` - Compile and check coding solutions.
* `GET /forum` - Load forum posts category tags.
* `POST /forum` - Create new forum posts.
* `PUT /forum/:id/like` - Like/Unlike forum posts.
* `POST /forum/:id/reply` - Comment reply to forum posts.
* `GET /certificates/verify/:id` - Public lookup verification for certificates QR keys.

---

## ☁️ Deployment Strategy

### Database (MongoDB Atlas)
1. Register on MongoDB Atlas and spawn a free Shared Cluster.
2. Whitelist `0.0.0.0/0` IP access permissions.
3. Copy connection string and update `MONGO_URI` in server's `.env` configuration.

### Backend (Render / Heroku)
1. Link your GitHub repository.
2. Select **Web Service** creation. Set Root Directory to `server`.
3. Set build command to `npm install` and start command to `node server.js`.
4. Configure environment variables in the dashboard settings.

### Frontend (Vercel / Netlify)
1. Create a Vercel project linking your GitHub repo.
2. Set Root Directory to `client`.
3. Vercel automatically detects Vite configurations. Deploy!
