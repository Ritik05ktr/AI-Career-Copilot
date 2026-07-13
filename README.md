# AI Career Copilot 🚀

AI Career Copilot is a full-stack MERN application integrated with Google Gemini AI designed to bridge the gap between job seekers and their dream roles. The platform allows users to upload their resumes, parses them against specific job descriptions to detect skill gaps, and generates an automated, dynamic interview preparation roadmap along with ATS-optimized resume downloads.

🌐 **Live Demo:** [ai-career-copilot-1-krna.onrender.com](https://ai-career-copilot-1-krna.onrender.com)

---

## 🌟 Key Features

- **AI-Powered Resume Parsing & Gap Analysis:** Leverages Google Gemini AI to analyze uploaded resumes against targeted job descriptions, instantly identifying missing keywords, technical skills, and experience gaps.
- **Dynamic Interview Prep Roadmap:** Generates personalized, real-time interview questions and behavioral simulations based on the gap analysis.
- **ATS-Optimized PDF Generation:** Features a backend compilation pipeline that converts modified data into an ATS-friendly PDF layout.
- **Secure Authentication:** Implements JWT-based user authentication and secure route guards for personalized dashboards.
- **Robust File Processing:** Integrates Multer middleware to handle multi-format, secure document uploads efficiently.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, JavaScript (ES6+), SCSS (Modular & Responsive Design)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI Integration:** Google Gemini AI API
- **Authentication:** JSON Web Tokens (JWT), Cryptographic Hashing
- **Libraries & Tools:** Puppeteer (for PDF generation), Multer (for file uploads), Postman (for API testing)

---

## 🏗️ System Architecture & Workflow

1. **User Authentication:** User registers/logs in securely via JWT.
2. **Input Processing:** The user uploads a resume (processed via `Multer`) and pastes a target Job Description (JD).
3. **AI Core Analysis:** The backend securely pipes the text data to the `Gemini AI API` using customized system prompts.
4. **Insight Generation:** AI returns structured JSON data containing a percentage match, missing skills, and tailored interview prep questions.
5. **PDF Pipeline:** If requested, the backend runs a headless `Puppeteer` instance to render an ATS-optimized HTML layout and compile it directly into a downloadable PDF document.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local installation
- Gemini AI API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Ritik05ktr/AI-Career-Copilot.git](https://github.com/Ritik05ktr/AI-Career-Copilot.git)
   cd AI-Career-Copilot

   Backend Setup:

Navigate to the server directory (if separate) or open the root:

Create a .env file and add the following:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
Install dependencies and start the server:

Bash
npm install
npm start
Frontend Setup:

Navigate to the client directory:

Bash
cd client
npm install
npm run dev
🔒 Security & Optimization Highlights
API Security: All endpoints are protected with structured JWT verification middleware to block unauthorized requests.

Payload Management: Leverages static assets delivery optimization and handles isolated state-driven logic on the frontend to minimize unnecessary re-renders.

Modular Architecture: Built using clean MVC (Model-View-Controller) structure on the backend and highly reusable functional components on the frontend.
