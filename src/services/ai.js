const { z } = require('zod');
const Groq = require('groq-sdk');
const fs = require('fs');

const AiResponseSchema = z.object({
  category: z.string(),
  subcategory: z.string(),
  severity: z.number().min(0).max(100),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  durationDays: z.number().min(0),
  summary: z.string(),
  keywords: z.array(z.string())
});

let groq = null;
const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
if (apiKey) {
  groq = new Groq({ apiKey: apiKey });
}

async function analyzeComplaint(description, durationDays = 0) {
  if (!groq) {
    throw new Error("AI is not configured. Missing API key.");
  }

  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: `You are an expert civic infrastructure AI assistant responsible for analyzing citizen complaints.
Your goal is to extract structured data accurately and assess the severity of issues based on standard municipal guidelines.

CRITICAL INSTRUCTIONS:
1. "category" MUST be one of: "Water", "Roads", "Garbage", "Streetlights", "Drainage", "Public Safety", "Other".
2. "severity" MUST be a number between 0 and 100.
   - 0-20: Minor nuisance (e.g., litter, dim streetlight).
   - 21-50: Moderate issue (e.g., small pothole, missed garbage pickup).
   - 51-80: Significant disruption (e.g., localized flooding, large pothole).
   - 81-100: Critical emergency (e.g., major water main break, dangerous sinkhole, exposed live wires).
3. "urgency" MUST logically match severity: "low" (0-20), "medium" (21-50), "high" (51-80), "critical" (81-100).
4. "summary" MUST be exactly 1 short sentence summarizing the core issue.
5. "durationDays" MUST be the number of days the issue has persisted, default to 1 if unstated.

Output strictly valid JSON matching this schema:
{
  "category": "string",
  "subcategory": "string",
  "severity": 85,
  "urgency": "critical",
  "durationDays": 2,
  "summary": "Massive water leak causing severe flooding.",
  "keywords": ["water leak", "flooding", "burst pipe"]
}`
        },
        {
          role: "user",
          content: `Complaint: ${description}\nReported duration: ${durationDays} days`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    const validated = AiResponseSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error("Groq analysis failed:", error.message);
    throw new Error("Failed to process complaint via AI. Please try again.");
  }
}

// Demo mode removed to make system fully operational

const RootCauseSchema = z.object({
  probableRootCause: z.string(),
  confidence: z.number().min(0).max(100),
  evidence: z.array(z.string()),
  recommendedAction: z.string()
});

async function generateRootCause(clusterCategory, descriptions) {
  if (!groq) {
    // Fallback if no API key
    return {
      probableRootCause: `Pattern of ${clusterCategory} issues detected`,
      confidence: 70,
      evidence: ["Multiple similar reports in close proximity"],
      recommendedAction: "Dispatch inspection team to assess the area."
    };
  }

  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: `You are an expert civic infrastructure AI. Analyze a cluster of citizen reports to deduce the underlying root cause.
Your goal is to synthesize multiple reports into a single, highly accurate hypothesis that municipal workers can act upon.

CRITICAL INSTRUCTIONS:
1. "probableRootCause" MUST be a single, concise sentence identifying the core mechanical or systemic failure.
2. "confidence" MUST be a number between 0 and 100 based on how closely the reports align. (e.g. 3 exact same reports = 90+, vague reports = 50-60).
3. "evidence" MUST be an array of 2-3 short bullet points summarizing WHY you believe this is the cause.
4. "recommendedAction" MUST be a specific, actionable instruction for city dispatch (e.g., "Dispatch vacuum truck to clear blocked storm drain").

Output strictly valid JSON matching this schema:
{
  "probableRootCause": "string",
  "confidence": 85,
  "evidence": ["string 1", "string 2"],
  "recommendedAction": "string"
}`
        },
        {
          role: "user",
          content: `Category: ${clusterCategory}\nReports:\n${descriptions.map((d, i) => `${i+1}. ${d}`).join('\n')}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return RootCauseSchema.parse(parsed);
  } catch (error) {
    console.error("Groq root cause analysis failed:", error.message);
    return {
      probableRootCause: `Pattern of ${clusterCategory} issues detected (AI Error)`,
      confidence: 50,
      evidence: ["Multiple reports"],
      recommendedAction: "Investigate manually."
    };
  }
}

async function generateSystemInsight(categoryData, timelineData) {
  if (!groq) {
    return "AI insights currently offline due to missing API key.";
  }

  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: `You are an expert civic infrastructure AI data analyst. You are provided with recent complaint volume data and categorical breakdowns.
Your job is to write a single, punchy, 1-sentence insight highlighting an emerging trend or area of concern.
Do not use pleasantries or introductory text. Just output the single sentence. For example: "Water complaints have surged by 40% in the last 48 hours."`
        },
        {
          role: "user",
          content: `Category Data: ${JSON.stringify(categoryData)}\nTimeline Data (Last 7 Days): ${JSON.stringify(timelineData)}`
        }
      ]
    });

    return response.choices[0].message.content.trim().replace(/"/g, '');
  } catch (error) {
    console.error("Groq insight generation failed:", error.message);
    return "System experiencing high volume of reports. Data patterns being actively monitored.";
  }
}

const MockComplaintSchema = z.object({
  complaints: z.array(z.object({
    description: z.string(),
    duration: z.number().min(1),
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
    affectedPeople: z.number().min(0)
  }))
});

async function generateMockComplaints(count = 5) {
  if (!groq) {
    throw new Error("AI is not configured. Missing API key.");
  }

  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: `You are an expert realistic test data generator. Generate exactly ${count} highly realistic, varied citizen complaints set in random real cities in India (e.g. Mumbai, Delhi, Bangalore, Chennai, Pune).
These must sound like real angry or concerned citizens reporting civic issues.
Include appropriate latitudes and longitudes roughly matching the cities chosen.
Output strictly valid JSON matching this schema:
{
  "complaints": [
    {
      "description": "string (the raw complaint from citizen)",
      "duration": 5 (number of days it has been an issue),
      "latitude": 19.0760,
      "longitude": 72.8777,
      "address": "string (realistic Indian street address or landmark)",
      "affectedPeople": 50 (estimated number of affected people)
    }
  ]
}`
        },
        {
          role: "user",
          content: `Generate ${count} realistic Indian civic complaints.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    const validated = MockComplaintSchema.parse(parsed);
    return validated.complaints;
  } catch (error) {
    console.error("Groq mock generation failed:", error.message);
    return [];
  }
}

async function transcribeAudio(filePath) {
  if (!groq) {
    throw new Error("AI is not configured. Missing API key.");
  }

  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
    });
    return transcription.text;
  } catch (error) {
    console.error("Groq transcription failed:", error.message);
    throw new Error("Failed to transcribe audio.");
  }
}

async function verifyResolution(beforeImageBase64, afterImageBase64, complaintDetails, note) {
  if (!groq) return { verificationStatus: "UNAVAILABLE", confidence: 0, evidence: ["AI offline."] };
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Verify if these photos show a resolved civic issue. Original issue: "${complaintDetails}". Resolution Note: "${note}". Reply strictly with JSON: {"verificationStatus": "LIKELY_RESOLVED" | "UNCERTAIN" | "NOT_RESOLVED", "confidence": number(0-100), "evidence": ["reason 1", "reason 2"]}` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${afterImageBase64}` } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      verificationStatus: parsed.verificationStatus || "UNCERTAIN",
      confidence: parsed.confidence || 50,
      evidence: parsed.evidence || ["AI returned unstructured response"]
    };
  } catch (err) {
    console.error("AI vision verification failed:", err.message);
    return { verificationStatus: "UNAVAILABLE", confidence: 0, evidence: ["Vision model unavailable for this API key or error occurred."] };
  }
}

async function generateHotspotPredictions(clusterData) {
  if (!groq) return [{ ward: "N/A", riskLevel: "High", prediction: "AI offline, mock prediction.", recommendation: "Check sensors." }];
  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: `You are an expert civic AI predicting future infrastructure failures based on current cluster data.
Output strictly valid JSON matching this schema:
{
  "predictions": [
    {
      "ward": "string",
      "riskLevel": "Critical | High | Medium",
      "prediction": "string (1 sentence)",
      "recommendation": "string (1 sentence)"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Current Clusters: ${JSON.stringify(clusterData)}`
        }
      ],
      response_format: { type: "json_object" }
    });
    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed.predictions;
  } catch (err) {
    console.error("Hotspot prediction failed:", err.message);
    return [];
  }
}

async function evaluateMunicipalPerformance(municipalCorp, data) {
  if (!groq) return "AI offline. Based on raw metrics, review pending and critical issues closely.";
  
  try {
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: "You are a Chief Infrastructure Analyst advising the State Government. Analyze the municipal corporation's data and output a strictly 2-sentence performance review and recommendation. Focus on resolution rate and critical problems."
        },
        {
          role: "user",
          content: `Municipality: ${municipalCorp}\nData: Total Issues: ${data.total}, Resolved: ${data.resolved}, Pending: ${data.pending}, Critical: ${data.critical}`
        }
      ]
    });
    return response.choices[0].message.content.trim().replace(/"/g, '');
  } catch(err) {
    console.error("AI Performance Review failed:", err.message);
    return "Error generating AI performance review. Please refer to raw metrics.";
  }
}

module.exports = {
  analyzeComplaint,
  generateRootCause,
  generateSystemInsight,
  generateMockComplaints,
  transcribeAudio,
  verifyResolution,
  generateHotspotPredictions,
  evaluateMunicipalPerformance
};
