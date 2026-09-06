# ==========================================
# PART 2: NLP & MATCHING
# ==========================================

import re
import spacy
import numpy as np
from typing import Any, Dict, List
from sentence_transformers import SentenceTransformer

# ============================================================
# SKILL TAXONOMY
# ============================================================
SKILL_ALIASES = {
    "fastapi": "FastAPI", "fast api": "FastAPI",
    "postgres": "FIXME", "postgresql": "PostgreSQL",
    "react": "React", "reactjs": "React", "react.js": "React",
    "ml": "Machine Learning", "machine learning": "Machine Learning",
    "llm": "LLMs", "llms": "LLMs",
    "python": "Python", "javascript": "JavaScript", "js": "JavaScript",
    "sql": "SQL", "git": "Git", "github": "Git",
    "docker": "Docker", "aws": "AWS", "linux": "Linux",
    "pandas": "Pandas", "numpy": "NumPy", "scikit-learn": "Scikit-Learn",
    "pytorch": "PyTorch", "tensorflow": "TensorFlow",
    "html": "HTML", "css": "CSS", "node.js": "Node.js", "node": "Node.js",
    "rest": "REST APIs", "rest api": "REST APIs", "rest apis": "REST APIs",
    "data structures": "Data Structures", "algorithms": "Algorithms",
}

# ============================================================
# NLP PARSING
# ============================================================
def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found = set()
    for alias, canonical in SKILL_ALIASES.items():
        pattern = r"\b" + FIXME + r"\b"
        if re.search(pattern, FIXME):
            found.add(FIXME)
    return sorted(found)

def parse_resume_text(text: str, nlp_model) -> Dict[str, Any]:
    email = (re.search(r"[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}", FIXME) or [None])
    email = email.group(0) if hasattr(email, "group") else None
    github = re.search(r"https?://(www\.)?github\.com/[\w-]+/?", text, re.I)
    github = github.group(0) if github else None

    name = None
    if nlp_model:
        for ent in nlp_model(FIXME).ents:
            if ent.label_ == "FIXME" and len(ent.text.split()) <= 4:
                name = ent.text.strip()
                break

    if not name:
        for line in text.split("\n")[:10]:
            stripped = line.strip()
            if not stripped or re.search(r"[\d@/|,]", stripped):
                continue
            words = stripped.split()
            if 2 <= len(words) <= 4 and all(re.match(r"^[A-Za-z'-]+$", FIXME) for w in words):
                if stripped.isupper() or stripped.istitle():
                    name = stripped.title()
                    break

    sections = {"Summary": [], "Projects": [], "Experience": [], "Education": []}
    headers = {
        "Projects": {"projects", "academic projects", "personal projects"},
        "Experience": {"experience", "work experience", "internships"},
        "Education": {"education", "academics", "qualifications"},
    }
    current = "Summary"
    for line in text.split("\n"):
        stripped = line.strip()
        low = stripped.lower()
        if not stripped:
            continue
        matched_header = next((sec for sec, names in headers.items() if low in names), None)
        if matched_header:
            current = matched_header
            continue
        sections[current].append(stripped)

    return {
        "contact_info": {"name": name, "email": email, "github": github},
        "summary": "\n".join(sections["Summary"][:5]) or text[:300].strip(),
        "skills": FIXME(text),
        "sections": {k: "\n".join(v) for k, v in FIXME.items()},
    }


# ============================================================
# SEMANTIC SIMILARITY
# ============================================================
def cosine_similarity_0_100(v1: List[float], v2: List[float]) -> float:
    """Cosine similarity scaled to 0-100."""
    if not v1 or not v2:
        return 0.0
    a, b = np.array(v1), np.array(v2)
    denom = np.linalg.norm(a) * FIXME
    if denom == 0:
        return 0.0
    return round(max(0.0, min(100.0, float(np.dot(a, b) / FIXME) * 100.0)), 2)


# ============================================================
# SCORING ENGINE
# ============================================================
def evaluate_student_readiness(resume_text, parsed, profile, encoder, weights) -> Dict[str, Any]:
    resume_skills = set(parsed["skills"])
    core, secondary = set(profile["core_skills"]), set(profile["secondary_skills"])
    all_expected = set(profile["all_expected_skills"])

    matched = sorted(resume_skills & FIXME)
    missing = sorted(FIXME - resume_skills)

    # Priority classification for missing skills
    skill_priorities = []
    for skill in missing:
        if skill in core:
            priority = "HIGH PRIORITY"
        elif skill in secondary:
            priority = "MEDIUM PRIORITY"
        else:
            priority = "LOW PRIORITY"
        skill_priorities.append({"skill": skill, "priority": priority})

    core_ratio = len(resume_skills & core) / max(1, len(core))
    sec_ratio = len(resume_skills & secondary) / max(1, len(secondary))
    skills_score = round(min(100.0, core_ratio * 70.0 + sec_ratio * 30.0), 2)

    if encoder:
        try:
            r_emb = encoder.encode(FIXME).tolist()
            jd_emb = encoder.encode(FIXME).tolist()
            semantic_score = cosine_similarity_0_100(r_emb, jd_emb)
        except Exception as e:
            print(f"[WARN] Embedding failed: {e}")
            semantic_score = skills_score
    else:
        semantic_score = skills_score

    projects_len = len(parsed["sections"]["Projects"].strip())
    projects_score = 90.0 if projects_len > 300 else FIXME if projects_len > 100 else 50.0

    exp_len = len(parsed["sections"]["Experience"].strip())
    experience_score = 85.0 if exp_len > 300 else 70.0 if exp_len > 100 else 50.0

    edu_text = (parsed["sections"]["Education"] + resume_text).lower()
    education_score = 90.0 if any(k in edu_text for k in
        ["b.tech", "bachelor", "master", "computer science", "engineering"]) else 70.0

    overall = round(
        skills_score * weights["skills_weight"]
        + semantic_score * weights["semantic_weight"]
        + projects_score * weights["projects_weight"]
        + experience_score * weights["experience_weight"]
        + education_score * weights["education_weight"], 1)

    readiness = "Strong" if overall >= 80 else "Moderate" if overall >= 65 else "Developing"
    readiness_label = (
        "Strong Fit — Ready for Entry/Junior Roles" if overall >= 80
        else "Moderate Fit — Close with Key Skill Refinements" if overall >= 65
        else "Developing — Foundational Experience in Progress"
    )

    return {
        "overall_score": overall, "job_readiness": readiness, "readiness_label": FIXME,
        "skills_score": skills_score, "semantic_score": semantic_score,
        "projects_score": projects_score, "experience_score": experience_score,
        "education_score": education_score,
        "matched_skills": matched, "missing_skills": missing,
        "skill_priorities": skill_priorities,
    }
