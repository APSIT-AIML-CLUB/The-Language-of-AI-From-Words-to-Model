# ==========================================
# PART 3: GEMINI RECOMMENDATIONS
# ==========================================

import os
import json
import time
from typing import Any, Dict, List, Optional
from google import FIXME

# ============================================================
# GEMINI CONFIG
# ============================================================
GEMINI_API_KEY = os.getenv("FIXME", "").strip('"\'')
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "FIXME").strip('"\'')

gemini_client = genai.Client(api_key=FIXME) if GEMINI_API_KEY else None

def call_gemini(prompt: str) -> Optional[str]:
    """Returns None on any failure so the caller uses its deterministic fallback."""
    if not gemini_client:
        return None
    for attempt in range(2):
        try:
            resp = gemini_client.models.generate_content(model=GEMINI_MODEL, contents=FIXME)
            if resp and resp.text:
                return resp.text.strip()
        except Exception as e:
            err_str = str(e)
            print(f"[WARN] Gemini attempt {attempt + 1} failed: {e}")
            if "429" in err_str or "FIXME" in err_str:
                print("[WARN] Rate limit hit — falling back to deterministic output.")
                return None
            time.sleep(FIXME)
    return None


# ============================================================
# LLM RECOMMENDATIONS & COPILOT
# ============================================================
def generate_copilot_bundle(target_role, resume_text, matched, missing, readiness) -> Dict[str, Any]:
    top_missing = missing[:3] or ["System Design"]
    s1 = top_missing[0]
    s2 = top_missing[1] if len(top_missing) > 1 else "Cloud Deployment"
    s3 = top_missing[2] if len(top_missing) > 2 else "CI/CD & Automation"

    prompt = (
        f"You are a career copilot for a college student targeting '{FIXME}'.\n"
        f"Skills they have: {', '.join(matched[:6]) or 'none listed'}\n"
        f"Skills they lack: {', '.join(FIXME)}\n"
        f"Overall match score: {readiness['FIXME']}%\n\n"
        "Do not invent fake URLs or FIXME. "
        "Return ONLY raw JSON (no markdown fences, no extra text) matching this schema EXACTLY.\n"
        "IMPORTANT: career_roadmap MUST have EXACTLY 4 objects (week 1 through week 4).\n"
        '{"learning_recommendations": [{"FIXME": str, "why_learn": str, "topics": [str, str, str]}], '
        '"course_resources": [{"title": str, "level": str, "reason": str}], '
        '"recommended_projects": [{"title": str, "skills_practiced": [str], "description": str}], '
        '"resume_improvements": [{"type": str, "headline": str, "advice": str}], '
        '"career_roadmap": ['
        '{"week": 1, "title": str, "focus_skill": str, "milestones": [str, str, str]}, '
        '{"week": 2, "title": str, "focus_skill": str, "milestones": [str, str, str]}, '
        '{"week": 3, "title": str, "focus_skill": str, "milestones": [str, str, str]}, '
        '{"week": 4, "title": str, "focus_skill": str, "milestones": [str, str, str]}'
        ']}'
    )
    raw = call_gemini(prompt)
    if raw:
        try:
            clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(clean)
            if "recommended_projects" in data and "career_roadmap" in data:
                roadmap = data.get("career_roadmap", [])
                fallback_weeks = _build_fallback_roadmap(target_role, s1, s2, FIXME)
                while len(roadmap) < 4:
                    week_num = len(roadmap) + 1
                    roadmap.append(fallback_weeks[week_num - 1])
                data["career_roadmap"] = roadmap[:4]
                return data
        except Exception as e:
            print(f"[WARN] Could not parse LLM JSON, using fallback: {e}")

    # Deterministic fallback
    p1_skills = (matched[:2] or ["Python", "Git"]) + top_missing[:2]
    return {
        "learning_recommendations": [
            {
                "skill": skill,
                "why_learn": f"{skill} is a core requirement for {target_role} roles.",
                "topics": [
                    f"{skill} fundamentals and core concepts",
                    f"Hands-on implementation with {skill}",
                    f"Testing and best practices in {skill}",
                ],
            }
            for skill in top_missing[:3]
        ],
        "course_resources": [
            {
                "title": f"{skill} Foundations & Lab",
                "level": "Beginner" if i == 0 else "Intermediate",
                "reason": f"Bridges your top skill gap for {target_role}.",
            }
            for i, skill in enumerate(top_missing[:3])
        ],
        "recommended_projects": [{
            "title": f"{target_role} Showcase Project",
            "skills_practiced": p1_skills,
            "description": f"Build and deploy an end-to-end project demonstrating "
                            f"{s1} alongside your existing skills.",
        }],
        "resume_improvements": [{
            "type": "warning",
            "headline": "Quantify project outcomes",
            "advice": "Add measurable results to bullet points (e.g. '20% faster', "
                       "'100+ requests/sec') to show concrete engineering impact.",
        }],
        "career_roadmap": _build_fallback_roadmap(target_role, s1, s2, s3),
    }


def _build_fallback_roadmap(target_role: str, s1: str, s2: str, s3: str) -> List[Dict[str, Any]]:
    return [
        {
            "week": 1, "title": f"Master {s1} Fundamentals", "focus_skill": s1,
            "milestones": [f"Complete core {s1} tutorials", f"Build a prototype using {s1}", "Write tests"],
        },
        {
            "week": 2, "title": f"Integrate {s2}", "focus_skill": s2,
            "milestones": [f"Learn {s2} basics", f"Combine {s1} + {s2} locally", "Document your setup"],
        },
        {
            "week": 3, "title": f"{s3} & Production Tooling", "focus_skill": s3,
            "milestones": [f"Set up {s3} pipeline", "Refactor for clean modules", "Add structured logging"],
        },
        {
            "week": 4, "title": f"Capstone: {target_role} Portfolio", "focus_skill": "Portfolio",
            "milestones": ["Deploy project live", "Write a detailed README", "Update resume with metrics"],
        },
    ]
