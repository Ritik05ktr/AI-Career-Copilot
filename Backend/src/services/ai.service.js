const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

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
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
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
Generate a professional ATS friendly resume.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return JSON with only one field:
html

The resume should:
- Be 1-2 pages
- Look professional
- Match the job description
- Highlight relevant skills
- Not look AI generated
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
