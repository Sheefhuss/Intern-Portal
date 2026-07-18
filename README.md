#  Intern Portal — Centralized Internship Management Platform

**The Vision**: Build a centralized portal where interns, HR, and admins can manage the
entire internship lifecycle in one place — assigning and tracking tasks, scheduling
meetings, sending announcements, and automatically issuing verifiable completion
certificates, all in real time.

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Socket.IO Client (real-time notifications, chat, live updates)
- Plain CSS / inline styling (no UI framework)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO (server)
- JWT authentication + bcrypt password hashing
- node-cron (scheduled jobs)
- Puppeteer (server-rendered PDF certificates)
- QRCode (certificate verification codes)

**Third-party / APIs**
- Brevo (Sendinblue) Transactional Email API — invites, offer letters, password resets,
  certificates, meeting and task notifications, announcements
- UptimeRobot — pings `/health` every 5 minutes to keep the free-tier backend awake

---

## Features Built

**Auth & Onboarding**
- Invite-only accounts: admins/HR invite an intern by email, which sends a one-time
  passcode; the intern uses it to set their own password and activate their account
- Offer-letter email flow for new interns, with domain/batch tagging
- JWT-based sessions, rate-limited login/signup, forgot/reset password via emailed link
- Role-based access: `intern`, `hr`, `admin`

**Tasks**
- Task creation targeted at an individual, or a whole domain + batch
- Submission lifecycle: pending → submitted → hr_reviewed → reviewed, with reviewer notes
- Deadlines, tracking view, and reset-to-pending flow with email notification

**Certificates**
- Auto-issued the moment all of an intern's tasks are marked `reviewed`
- Certificate view page with QR-code verification link
- Real PDF download (server-rendered via Puppeteer) and a "Download PDF" button/email link
- Emailed automatically with both a "View Certificate" and "Download PDF" action

**Meetings**
- Admins/HR can post open meeting slots; interns can book them
- Interns can request a meeting; admins/HR approve with a link + scheduled time
- Automated reminder emails ~1 hour before a meeting (cron job every 5 minutes)

**Admin Panel**
- Full intern registry with filtering, batch management, and one-click invites
- Revoke / mark-complete controls on intern accounts
- Dashboard stats tailored per role (admin / HR / intern)

**Real-time**
- Socket.IO-powered notifications, chat, and live meeting/task updates
- Notification center with per-role and per-user targeting, read/unread state

**Announcements**
- Admin/HR can broadcast an announcement to all users, a specific role, or a batch
- Delivered as both an in-app notification and an email

**Profile**
- Editable name, LinkedIn, mobile number, and photo
- Certificate + task summary for interns

---

## Running Locally

Need Node.js and a MongoDB instance (local or Atlas) before starting.

**1. Clone the repo**
```bash
git clone https://github.com/Sheefhuss/Intern-Portal.git
cd Intern-Portal
```

**2. Set up the backend**
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_random_secret_string
FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:5000
BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_verified_brevo_sender_email
EMAIL_FROM_NAME=Enginow Portal
```

Start the backend:
```bash
npm run dev
```

> Note: there's no self-registration for `admin`/`hr` accounts — the first admin needs
> to be created directly in MongoDB (insert a `User` document with `role: "admin"` and
> `status: "active"`). Every account after that can be invited from the Admin Panel.

**3. Set up the frontend**
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

**4. Open the app**

Go to `http://localhost:5173` in your browser.

---

## Live Demo

[Intern Portal — Live App](https://intern-portal-ivory-nine.vercel.app)


## Team

Sheefa Hussain
Mahiya Haider

---

## Known Bugs & Limitations

- Certificate PDF generation uses Puppeteer, which launches a headless Chromium
  instance — on free-tier hosts with limited memory this can be slow on the first
  request after a cold start.
- No self-service admin/HR signup — the first admin account must be created manually
  in the database.
