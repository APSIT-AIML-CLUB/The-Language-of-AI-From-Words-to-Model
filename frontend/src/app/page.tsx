"use client";

import React, { useState, useEffect } from "react";

interface HealthStatus {
  status: string;
  database: string;
  project: string;
  version: string;
  environment: string;
}

interface ParsedResume {
  contact_info: {
    name: string | null;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    github: string | null;
  };
  summary: string;
  skills: string[];
  sections?: Record<string, string>;
}

interface ResumeResponseData {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  raw_text: string | null;
  parsed_data: ParsedResume | null;
  status: string;
}

interface SkillPriority {
  skill: string;
  priority: "HIGH PRIORITY" | "MEDIUM PRIORITY" | "LOW PRIORITY";
}

interface LearningRecommendation {
  skill: string;
  why_learn: string;
  topics: string[];
}

interface CourseResource {
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  reason: string;
}

interface RecommendedProject {
  title: string;
  skills_practiced: string[];
  description: string;
}

interface ResumeImprovement {
  type: "warning" | "suggestion" | "praise";
  headline: string;
  advice: string;
}

interface RoadmapWeek {
  week: number;
  title: string;
  focus_skill: string;
  milestones: string[];
}

interface CareerAnalysisData {
  id: string;
  resume_id: string;
  target_role: string;
  role_title: string;
  role_category: string;
  overall_score: number;
  job_readiness: "Strong" | "Moderate" | "Developing";
  readiness_label: string;
  scores_breakdown: {
    technical_skills: number;
    semantic_match: number;
    projects: number;
    experience: number;
    education: number;
  };
  matched_skills: string[];
  missing_skills: string[];
  skill_priorities: SkillPriority[];
  learning_recommendations: LearningRecommendation[];
  course_resources: CourseResource[];
  recommended_projects: RecommendedProject[];
  resume_improvements: ResumeImprovement[];
  career_roadmap: RoadmapWeek[];
  created_at: string;
}

const POPULAR_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "Data Analyst",
  "Data Scientist",
  "DevOps Engineer",
  "Cloud Engineer",
  "Mobile App Developer",
  "Cyber Security Analyst",
];

export default function Home() {
  const BACKEND_URL = "http://localhost:8000/api/v1";

  // System Health
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Resume Ingestion State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeResult, setResumeResult] = useState<ResumeResponseData | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Target Role & Job Description State
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [customJdText, setCustomJdText] = useState("");
  const [showCustomJd, setShowCustomJd] = useState(false);

  // Career Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<CareerAnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Interactive Checklist for Roadmap
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>({});

  const toggleMilestone = (key: string) => {
    setCheckedMilestones((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      setHealthLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/health`);
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        } else {
          setHealth(null);
        }
      } catch {
        setHealth(null);
      } finally {
        setHealthLoading(false);
      }
    };
    checkHealth();
  }, []);

  // Upload Resume handler
  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;

    setResumeUploading(true);
    setResumeError(null);
    setResumeResult(null);

    const formData = new FormData();
    formData.append("file", resumeFile);

    try {
      const res = await fetch(`${BACKEND_URL}/resumes/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to upload and parse resume.");
      }

      const data = await res.json();
      setResumeResult(data);
    } catch (err: any) {
      setResumeError(err.message || "An unexpected error occurred during resume ingestion.");
    } finally {
      setResumeUploading(false);
    }
  };

  // Run Career Readiness Analysis
  const handleAnalyzeCareer = async () => {
    if (!targetRole.trim()) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setAnalysisStep(1);

    // Visual step progression
    const timer1 = setTimeout(() => setAnalysisStep(2), 700);
    const timer2 = setTimeout(() => setAnalysisStep(3), 1500);
    const timer3 = setTimeout(() => setAnalysisStep(4), 2300);

    try {
      const res = await fetch(`${BACKEND_URL}/career/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: resumeResult?.id || "default",
          target_role: targetRole.trim(),
          job_description: customJdText.trim() ? customJdText.trim() : null,
          skills_weight: 0.40,
          semantic_weight: 0.25,
          projects_weight: 0.15,
          experience_weight: 0.10,
          education_weight: 0.10,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Career readiness analysis failed.");
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setAnalysisError(err.message || "An unexpected error occurred during career analysis.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  // ── Download PDF Report ─────────────────────────────────────────────
  const downloadReport = () => {
    if (!analysisResult) return;
    const r = analysisResult;
    const candidate = resumeResult?.parsed_data?.contact_info?.name || "Student Candidate";
    const email = resumeResult?.parsed_data?.contact_info?.email || "";
    const generatedOn = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const scoreColor = r.overall_score >= 80 ? "#22c55e" : r.overall_score >= 65 ? "#eab308" : "#f97316";
    const priorityColor = (p: string) => p === "HIGH PRIORITY" ? "#ef4444" : p === "MEDIUM PRIORITY" ? "#f97316" : "#22c55e";

    const roadmapHTML = (r.career_roadmap || []).map(week => `
      <div style="break-inside:avoid; border:1px solid #27272a; border-radius:12px; padding:16px; margin-bottom:12px; background:#18181b;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
          <span style="background:#6366f1; color:#fff; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px;">WEEK ${week.week}</span>
          <span style="font-weight:700; color:#f4f4f5; font-size:14px;">${week.title}</span>
          <span style="margin-left:auto; font-size:11px; color:#a1a1aa; background:#27272a; padding:2px 8px; border-radius:8px;">${week.focus_skill}</span>
        </div>
        <ul style="margin:0; padding-left:18px; color:#a1a1aa; font-size:13px; line-height:1.9;">
          ${(week.milestones || []).map(m => `<li>${m}</li>`).join("")}
        </ul>
      </div>`).join("");

    const skillsHTML = (r.matched_skills || []).map(s =>
      `<span style="display:inline-block; background:#166534; color:#86efac; font-size:12px; font-weight:600; padding:3px 10px; border-radius:20px; margin:3px;">✓ ${s}</span>`
    ).join("");

    const missingHTML = (r.skill_priorities || []).map(sp =>
      `<span style="display:inline-block; background:#27272a; color:#f4f4f5; font-size:12px; font-weight:600; padding:3px 10px; border-radius:20px; margin:3px;">
        <span style="color:${priorityColor(sp.priority)};">●</span> ${sp.skill} <span style="font-size:10px; color:#71717a;">${sp.priority}</span>
      </span>`
    ).join("");

    const learningHTML = (r.learning_recommendations || []).map((lr, i) => `
      <div style="break-inside:avoid; border:1px solid #27272a; border-radius:10px; padding:14px; margin-bottom:10px; background:#18181b;">
        <div style="font-weight:700; color:#818cf8; margin-bottom:6px; font-size:14px;">${lr.skill}</div>
        <div style="color:#a1a1aa; font-size:12px; margin-bottom:8px;">${lr.why_learn}</div>
        <ul style="margin:0; padding-left:16px; color:#71717a; font-size:12px; line-height:1.8;">
          ${(lr.topics || []).map(t => `<li>${t}</li>`).join("")}
        </ul>
      </div>`).join("");

    const improvementsHTML = (r.resume_improvements || []).map(ri => `
      <div style="break-inside:avoid; border-left:3px solid #f97316; padding:10px 14px; margin-bottom:10px; background:#1c1917; border-radius:0 8px 8px 0;">
        <div style="font-weight:700; color:#f4f4f5; font-size:13px; margin-bottom:4px;">${ri.headline}</div>
        <div style="color:#a1a1aa; font-size:12px;">${ri.advice}</div>
      </div>`).join("");

    const breakdownRows = [
      ["Technical Skills", r.scores_breakdown.technical_skills, "40%"],
      ["Semantic Match", r.scores_breakdown.semantic_match, "25%"],
      ["Projects Depth", r.scores_breakdown.projects, "15%"],
      ["Experience", r.scores_breakdown.experience, "10%"],
      ["Education", r.scores_breakdown.education, "10%"],
    ].map(([label, score, weight]) => `
      <tr>
        <td style="padding:8px 12px; color:#a1a1aa; font-size:13px;">${label}</td>
        <td style="padding:8px 12px; color:#a1a1aa; font-size:12px;">${weight}</td>
        <td style="padding:8px 12px; font-weight:700; color:#f4f4f5;">${score}%</td>
        <td style="padding:8px 12px;">
          <div style="background:#27272a; border-radius:10px; height:6px; width:120px;">
            <div style="background:#6366f1; border-radius:10px; height:6px; width:${score}%"></div>
          </div>
        </td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Career Readiness Report — ${candidate}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #09090b; color: #f4f4f5; padding: 40px; max-width: 900px; margin: 0 auto; }
  h2 { font-size: 14px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px; margin: 28px 0 14px; padding-bottom: 6px; border-bottom: 1px solid #27272a; }
  table { width: 100%; border-collapse: collapse; }
  tr:nth-child(even) { background: #18181b; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1e1b4b,#18181b); border-radius:16px; padding:28px 32px; margin-bottom:28px; border:1px solid #312e81;">
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
      <div style="width:36px; height:36px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px;">⚡</div>
      <div>
        <div style="font-weight:800; font-size:18px; color:#fff;">ResumeIQ AI</div>
        <div style="font-size:11px; color:#818cf8; font-weight:600;">CAREER READINESS REPORT</div>
      </div>
      <div style="margin-left:auto; text-align:right;">
        <div style="font-size:11px; color:#71717a;">Generated on</div>
        <div style="font-size:12px; color:#a1a1aa; font-weight:600;">${generatedOn}</div>
      </div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:flex-end;">
      <div>
        <div style="font-size:22px; font-weight:800; color:#fff;">${candidate}</div>
        ${email ? `<div style="color:#71717a; font-size:13px; margin-top:2px;">${email}</div>` : ""}
        <div style="margin-top:10px; display:flex; gap:8px;">
          <span style="background:#312e81; color:#818cf8; font-size:11px; font-weight:700; padding:3px 12px; border-radius:20px;">TARGET: ${r.role_title.toUpperCase()}</span>
          <span style="background:#1f2937; color:#9ca3af; font-size:11px; font-weight:700; padding:3px 12px; border-radius:20px;">${r.readiness_label}</span>
        </div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:52px; font-weight:900; color:${scoreColor}; line-height:1;">${r.overall_score}%</div>
        <div style="font-size:12px; color:#71717a; margin-top:4px;">OVERALL MATCH</div>
      </div>
    </div>
  </div>

  <!-- Score Breakdown -->
  <h2>Score Breakdown</h2>
  <table><tbody>${breakdownRows}</tbody></table>

  <!-- Skills -->
  <h2>Skills You Have (${r.matched_skills.length})</h2>
  <div style="margin-bottom:8px;">${skillsHTML || '<span style="color:#52525b; font-size:13px;">None detected</span>'}</div>

  <h2>Skills to Develop (${r.missing_skills.length})</h2>
  <div style="margin-bottom:8px;">${missingHTML || '<span style="color:#52525b; font-size:13px;">All core skills matched!</span>'}</div>

  <!-- Learning Recommendations -->
  <h2>Targeted Learning Recommendations</h2>
  ${learningHTML || '<p style="color:#52525b; font-size:13px;">No recommendations generated.</p>'}

  <!-- Resume Improvements -->
  <h2>Resume Improvement Advisor</h2>
  ${improvementsHTML || '<p style="color:#52525b; font-size:13px;">No improvements suggested.</p>'}

  <!-- 30-Day Roadmap -->
  <h2>30-Day Personalized Career Roadmap</h2>
  ${roadmapHTML || '<p style="color:#52525b; font-size:13px;">No roadmap generated.</p>'}

  <!-- Footer -->
  <div style="margin-top:32px; padding-top:16px; border-top:1px solid #27272a; text-align:center; color:#52525b; font-size:11px;">
    Generated by ResumeIQ AI &nbsp;•&nbsp; Powered by LangGraph Multi-Agent Orchestration &nbsp;•&nbsp; ${generatedOn}
  </div>
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ── Top Header & Branding ────────────────────────────────────────── */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 text-lg tracking-tight">
                  ResumeIQ AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  Student Edition
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Agentic Career & Resume Intelligence Platform</p>
            </div>
          </div>

          {/* Health & Engine Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-400">
              <span className={`w-2 h-2 rounded-full ${health?.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="font-medium text-zinc-300">
                {healthLoading ? "Connecting..." : health?.status === "online" ? "LangGraph Agents Active" : "Backend Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ── Hero Welcome Banner ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950 border border-zinc-800/80 p-8 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <span>🎓 Built for Students & Aspiring Engineers</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              How ready are you for your dream role?
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed">
              Upload your college resume, select your target tech role, and let our multi-agent AI copilot uncover your skill gaps, score your readiness, design hands-on projects, and build your personalized 30-day roadmap.
            </p>
          </div>
        </section>

        {/* ── Step-by-Step Student Input Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Resume Upload & Candidate Preview ──────────────── */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  1
                </div>
                <div>
                  <h2 className="font-semibold text-white text-base">Upload Your Resume</h2>
                  <p className="text-xs text-zinc-400">PDF or DOCX (text-based formats)</p>
                </div>
              </div>

              <form onSubmit={handleResumeUpload} className="space-y-4">
                <div className="border-2 border-dashed border-zinc-700/80 hover:border-indigo-500/60 transition-colors rounded-xl p-6 text-center bg-zinc-950/40 relative group cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResumeFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-zinc-200">
                      {resumeFile ? (
                        <span className="text-indigo-400 font-semibold">{resumeFile.name}</span>
                      ) : (
                        <span>Drag & drop resume, or <span className="text-indigo-400 underline">browse</span></span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">Max size 10MB • PyMuPDF & docx extraction</p>
                  </div>
                </div>

                {resumeError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {resumeError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!resumeFile || resumeUploading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 font-semibold text-white text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {resumeUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Parsing Resume with NLP...
                    </>
                  ) : (
                    <>Parse & Ingest Resume</>
                  )}
                </button>
              </form>

              {/* Parsed Candidate Quick Snapshot */}
              {resumeResult?.parsed_data && (
                <div className="mt-6 pt-5 border-t border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Extracted Profile</span>
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      NLP Parsed
                    </span>
                  </div>

                  <div className="bg-zinc-950/60 rounded-xl p-3.5 border border-zinc-800/60 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Candidate Name:</span>
                      <span className="font-semibold text-zinc-200">{resumeResult.parsed_data.contact_info.name || "Student Candidate"}</span>
                    </div>
                    {resumeResult.parsed_data.contact_info.email && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Email:</span>
                        <span className="text-zinc-300 truncate max-w-[200px]">{resumeResult.parsed_data.contact_info.email}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <span className="text-zinc-500 block mb-1.5">Detected Skills ({resumeResult.parsed_data.skills.length}):</span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {resumeResult.parsed_data.skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-medium border border-zinc-700/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Target Role & Career Analysis Form ─────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 sm:p-7 shadow-xl backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                  2
                </div>
                <div>
                  <h2 className="font-semibold text-white text-base">Select Your Target Role</h2>
                  <p className="text-xs text-zinc-400">Choose a predefined role or enter a customized title</p>
                </div>
              </div>

              {/* Quick Role Selection Pills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quick-Select Common Tech Roles</label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_ROLES.map((role) => {
                    const isSelected = targetRole.toLowerCase() === role.toLowerCase();
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setTargetRole(role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30"
                            : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Role Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Target Role Title</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer, Machine Learning Engineer"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Optional Job Description Collapsible Accordion */}
              <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950/30">
                <button
                  type="button"
                  onClick={() => setShowCustomJd(!showCustomJd)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Targeting a specific job posting? (Optional)
                  </span>
                  <span className="text-zinc-500 font-mono">{showCustomJd ? "− Collapse" : "+ Expand"}</span>
                </button>

                {showCustomJd && (
                  <div className="p-4 pt-1 border-t border-zinc-800/60 space-y-2">
                    <p className="text-[11px] text-zinc-400">
                      If you paste a specific job description, our system combines its exact requirements with our role knowledge base for high-precision matching.
                    </p>
                    <textarea
                      rows={4}
                      value={customJdText}
                      onChange={(e) => setCustomJdText(e.target.value)}
                      placeholder="Paste the job requirements, responsibilities, or qualification criteria here..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Action Error Box */}
              {analysisError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{analysisError}</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleAnalyzeCareer}
                disabled={analyzing || !targetRole.trim()}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-indigo-600/25 disabled:shadow-none flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>
                      {analysisStep === 1 && "ResumeAgent: Parsing Profile & Projects..."}
                      {analysisStep === 2 && "JobAgent: Resolving Target Competencies..."}
                      {analysisStep === 3 && "Skill & MatchAgent: Computing ATS Scoring..."}
                      {analysisStep === 4 && "Copilot: Synthesizing Career Roadmap..."}
                      {analysisStep === 0 && "Orchestrating Multi-Agent Workflow..."}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Analyze My Career Readiness</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Output Dashboard: Student Career Intelligence ────────────────── */}
        {analysisResult && (
          <div className="space-y-10 pt-4 animate-in fade-in duration-500">
            {/* ── Section 1: Hero Readiness Header ──────────────────────────── */}
            <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
                      Target Role: {analysisResult.role_title}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        analysisResult.job_readiness === "Strong"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : analysisResult.job_readiness === "Moderate"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      }`}
                    >
                      {analysisResult.readiness_label}
                    </span>
                  </div>

                  {/* Download Report */}
                  <button
                    type="button"
                    onClick={downloadReport}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer group w-fit"
                    title="Download full career readiness report as PDF"
                  >
                    <svg className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF Report
                  </button>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {analysisResult.job_readiness === "Strong" && "You're in great shape for this role!"}
                    {analysisResult.job_readiness === "Moderate" && "You're close! Bridge key gaps to stand out."}
                    {analysisResult.job_readiness === "Developing" && "A solid foundation. Follow your roadmap to level up."}
                  </h2>

                  <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                    Our multi-agent analysis computed an overall compatibility score of{" "}
                    <strong className="text-white font-semibold">{analysisResult.overall_score}%</strong> across technical competencies, semantic alignment, practical projects, and academic qualifications.
                  </p>
                </div>

                {/* Score Dial / Ring */}
                <div className="md:col-span-4 flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" className="text-zinc-800" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (264 * analysisResult.overall_score) / 100}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ${
                          analysisResult.overall_score >= 75
                            ? "text-emerald-500"
                            : analysisResult.overall_score >= 60
                            ? "text-indigo-500"
                            : "text-purple-500"
                        }`}
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-4xl font-black text-white tracking-tight">{analysisResult.overall_score}%</span>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Overall Match</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: Multi-Factor Match Breakdown ────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Deterministic Match Breakdown
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Technical Skills", score: analysisResult.scores_breakdown.technical_skills, weight: "40%" },
                  { label: "Semantic Profile", score: analysisResult.scores_breakdown.semantic_match, weight: "25%" },
                  { label: "Projects Depth", score: analysisResult.scores_breakdown.projects, weight: "15%" },
                  { label: "Experience & Work", score: analysisResult.scores_breakdown.experience, weight: "10%" },
                  { label: "Education / Degree", score: analysisResult.scores_breakdown.education, weight: "10%" },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>{item.label}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">W: {item.weight}</span>
                    </div>
                    <div className="text-2xl font-black text-white">{item.score}%</div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 3: Skills Matrix (Have vs Need) ────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills You Have */}
              <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Skills You Have ({analysisResult.matched_skills.length})
                  </h4>
                  <span className="text-[11px] text-emerald-400/90 font-medium">Verified from Resume</span>
                </div>

                {analysisResult.matched_skills.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No direct matching skills detected for this role taxonomy.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.matched_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold"
                      >
                        <span className="text-emerald-400">✓</span> {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills You Need (Prioritized Gaps) */}
              <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <span className="text-rose-400">✗</span> Skills You Need ({analysisResult.missing_skills.length})
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-medium">Prioritized for Learning</span>
                </div>

                {analysisResult.skill_priorities.length === 0 ? (
                  <p className="text-xs text-emerald-400">Awesome! You possess all primary expected skills for this role.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.skill_priorities.map((item, idx) => {
                      const isHigh = item.priority === "HIGH PRIORITY";
                      const isMed = item.priority === "MEDIUM PRIORITY";
                      return (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${
                            isHigh
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                              : isMed
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700"
                          }`}
                        >
                          <span>{item.skill}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              isHigh ? "bg-rose-500/20 text-rose-400" : isMed ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700 text-zinc-400"
                            }`}
                          >
                            {item.priority.replace(" PRIORITY", "")}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 4: Learning Recommendations & Skill Gaps ────────────── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Targeted Learning Recommendations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {analysisResult.learning_recommendations.map((rec, idx) => (
                  <div key={idx} className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-indigo-300">{rec.skill}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Skill Gap Guide
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Why Learn It?</span>
                      <p className="text-xs text-zinc-300 leading-relaxed">{rec.why_learn}</p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Key Focus Areas:</span>
                      <ul className="space-y-1">
                        {rec.topics.map((t, i) => (
                          <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                            <span className="text-indigo-400 select-none">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 5: Recommended Courses & Curricula ─────────────────── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Recommended Courses & Curricula
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {analysisResult.course_resources.map((crs, idx) => (
                  <div key={idx} className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Module {idx + 1}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {crs.level}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm leading-snug">{crs.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{crs.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 6: Hands-on Project Recommendations ────────────────── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Recommended Portfolio Projects (Bridge Your Gaps)
              </h3>
              <p className="text-xs text-zinc-400">
                These projects combine the skills you already have with the skills you're missing, giving you tangible proof for recruiters.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysisResult.recommended_projects.map((proj, idx) => (
                  <div key={idx} className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-6 space-y-4 relative overflow-hidden">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Capstone Project #{idx + 1}</span>
                      <h4 className="font-bold text-white text-base leading-tight">{proj.title}</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed">{proj.description}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Skills You Will Practice:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {proj.skills_practiced.map((skill, sIdx) => (
                          <span key={sIdx} className="px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700/60">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section 7: Resume Improvement Suggestions ─────────────────── */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Resume Improvement Advisor
              </h3>

              <div className="space-y-3">
                {analysisResult.resume_improvements.map((tip, idx) => {
                  const isWarn = tip.type === "warning";
                  const isPraise = tip.type === "praise";
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                        isWarn
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                          : isPraise
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                      }`}
                    >
                      <span className="text-base font-bold select-none mt-0.5">
                        {isWarn ? "⚠" : isPraise ? "✓" : "💡"}
                      </span>
                      <div className="space-y-1">
                        <span className="font-bold text-sm block text-white">{tip.headline}</span>
                        <p className="text-xs leading-relaxed text-zinc-300">{tip.advice}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section 8: Personalized 30-Day Learning Roadmap ───────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  30-Day Personalized Career Roadmap
                </h3>
                <span className="text-xs text-zinc-400 font-medium">Click checkboxes to track completion</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {analysisResult.career_roadmap.map((week) => (
                  <div key={week.week} className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Week {week.week}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {week.focus_skill}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm leading-snug">{week.title}</h4>

                      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                        {week.milestones.map((milestone, mIdx) => {
                          const mKey = `w${week.week}_m${mIdx}`;
                          const isDone = Boolean(checkedMilestones[mKey]);
                          return (
                            <label
                              key={mIdx}
                              onClick={() => toggleMilestone(mKey)}
                              className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => {}}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-zinc-800 border-zinc-700 cursor-pointer"
                              />
                              <span className={`leading-relaxed transition-all ${isDone ? "line-through text-zinc-500" : "group-hover:text-white"}`}>
                                {milestone}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            <span className="font-semibold text-zinc-400">ResumeIQ AI — Student Edition</span> • Powered by LangGraph Multi-Agent Orchestration & Google Gemini
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Analyze</span>
            <span>•</span>
            <span>Understand</span>
            <span>•</span>
            <span>Learn</span>
            <span>•</span>
            <span>Build</span>
            <span>•</span>
            <span>Improve</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
