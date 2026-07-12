const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job description",
    ),

  technicalQuestions: z
    .array(
      z.object({
        question: z.string().describe("Technical interview question"),
        intention: z
          .string()
          .describe("Why interviewer is asking this question"),
        answer: z
          .string()
          .describe("Expected answer approach and points to cover"),
      }),
    )
    .describe("Technical interview questions with intention and model answers"),

  behavioralQuestions: z
    .array(
      z.object({
        question: z.string().describe("Behavioral interview question"),
        intention: z.string().describe("Purpose behind asking this question"),
        answer: z
          .string()
          .describe("How candidate should answer this question"),
      }),
    )
    .describe("Behavioral interview questions with intention and answers"),

  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("Missing or weak skill"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("Importance of this skill gap"),
      }),
    )
    .describe("Candidate skill gaps"),

  preparationPlan: z
    .array(
      z.object({
        day: z.number().describe("Preparation day number starting from 1"),
        focus: z.string().describe("Main focus of the day"),
        tasks: z.array(z.string()).describe("Tasks to complete"),
      }),
    )
    .describe("7 day interview preparation roadmap"),

  title: z.string().describe("Job title for the interview preparation"),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
You are an expert technical interviewer and career coach.

Generate a complete interview preparation report.

STRICT RULES:
- Return ONLY JSON.
- Follow the provided JSON schema exactly.
- Do not change field names.
- Do not create extra fields.
- Do not use fields like candidate_name, interview_questions, skills_analysis.
- Do not return empty arrays.
- Generate realistic interview preparation content based on the resume and job description.

The report must include:

1. matchScore:
Score between 0 and 100.

2. technicalQuestions:
Generate 8-10 technical questions based on candidate skills, projects and job requirements.
Each question must include:
- question
- intention
- answer

3. behavioralQuestions:
Generate 5 behavioral questions.
Each question must include:
- question
- intention
- answer

4. skillGaps:
Analyze missing skills required for the job.
Include:
- skill
- severity

5. preparationPlan:
Create a 7 day preparation roadmap.
Each day must include:
- day
- focus
- tasks

6. title:
Job role name.

Candidate Resume:
${resume}

Candidate Self Description:
${selfDescription}

Job Description:
${jobDescription}

IMPORTANT:
Before returning final JSON, verify:
- technicalQuestions contains actual objects, not null
- behavioralQuestions contains actual objects, not null
- skillGaps contains actual objects, not null
- preparationPlan contains actual objects, not null
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  console.log("AI RAW RESPONSE:", response.text);

  return JSON.parse(response.text);
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    scale: 0.9,
    margin: {
      top: "10mm",
      bottom: "10mm",
      left: "10mm",
      right: "10mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe("HTML content of resume which can be converted into PDF"),
  });

  const prompt = `
You are a professional ATS Resume Writer and Senior Technical Recruiter.

Your task is to create a modern, clean, ATS-friendly resume in HTML format.

Candidate Resume:
${resume}

Candidate Self Description:
${selfDescription}

Target Job Description:
${jobDescription}

Return ONLY valid JSON in the following format:

{
  "html": "Complete HTML resume"
}

STRICT RULES:

- Return ONLY JSON.
- Do not include markdown.
- Do not include explanations.
- Do not include code fences.
- The JSON must contain ONLY one field:
  - html

==========================
RESUME REQUIREMENTS
==========================

The resume MUST be ATS-friendly.

The resume MUST fit within ONE page whenever possible.

The resume MUST NEVER exceed TWO pages.

Assume the candidate is a Fresher unless the resume clearly shows professional experience.

Keep the resume concise.

Maximum total words: 500-550 words.

Use short bullet points.

Avoid long paragraphs.

Use compact spacing.

Do NOT repeat technologies.

Do NOT repeat skills.

Do NOT add fake information.

Only include information supported by the provided Resume and Self Description.

IMPORTANT:

- Remove duplicate skills.
- Remove repetitive project descriptions.
- Limit every project to exactly 3 bullet points.
- Every bullet must contain at most 15 words.
- Do not exceed 550 words in total.
- If the content exceeds one page, shorten summaries and project descriptions instead of creating more pages.

==========================
SECTION ORDER
==========================

1. Name
2. Contact Information
3. Professional Summary
4. Skills
5. Projects
6. Experience (if available)
7. Education
8. Certifications (only if available)

Do NOT create unnecessary sections.

==========================
SUMMARY
==========================

Maximum 3 lines.

Highlight:
- Primary Tech Stack
- Career Goal
- Strongest Skills

==========================
SKILLS
==========================

Maximum 12-15 skills.

Group similar skills.

Example:

Languages:
Java, JavaScript

Frontend:
HTML, CSS, React

Backend:
Node.js, Express.js

Database:
MongoDB, MySQL

Tools:
Git, GitHub

==========================
PROJECTS
==========================

Include ONLY the BEST 2 projects.

For each project include:

Project Name

2-3 concise bullet points describing impact and implementation.

Technologies Used

Each bullet should be under 18 words.

Do NOT write long descriptions.

==========================
EXPERIENCE
==========================

If experience exists:

Maximum 4 bullet points.

Each bullet under 18 words.

Focus on achievements instead of responsibilities.

If no experience exists, omit this section entirely.

==========================
EDUCATION
==========================

Keep compact.

Maximum 2 lines.

==========================
CERTIFICATIONS
==========================

Only include if provided.

==========================
HTML REQUIREMENTS
==========================

Generate a COMPLETE HTML document.

Use inline CSS only.

Use clean ATS-friendly formatting.

Use the following CSS style:

body{
font-family:Arial,Helvetica,sans-serif;
font-size:11px;
line-height:1.25;
margin:18px;
color:#222;
}

h1{
font-size:24px;
margin:0 0 6px 0;
}

h2{
font-size:15px;
margin:8px 0 4px 0;
padding-bottom:2px;
border-bottom:1px solid #ccc;
}

p{
margin:2px 0;
}

ul{
margin:4px 0;
padding-left:18px;
}

li{
margin:2px 0;
}

.section{
margin-bottom:10px;
}

Do NOT use tables.

Do NOT use multiple columns.

Do NOT use images.

Do NOT use icons.

Do NOT use SVG.

Do NOT use JavaScript.

Do NOT use external CSS.

Do NOT use external fonts.

Keep the design simple, clean, professional, printable and ATS compatible.

Before returning the JSON verify:

- HTML is valid.
- Resume is concise.
- Resume fits within ONE page whenever possible.
- Resume never exceeds TWO pages.
- No repeated content.
- No unnecessary whitespace.
- No fake information.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumePdfSchema),
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

module.exports = {
  generateInterviewReport,
  generateResumePdf,
};
