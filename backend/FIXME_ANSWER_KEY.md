# ResumeIQ FIXME Answer Key

This document is for the instructor. It contains the sequential solutions for all 44 `FIXME` placeholders distributed across `1_input.py`, `2_nlp.py`, and `3_gemini.py`.

## INPUT STAGE (`1_input.py`)

1. **Concept**: FastAPI File Uploads
   - **Answer**: `File` (e.g. `File(...)`)
   - **Why**: `UploadFile = File(...)` is the standard way to declare an incoming file payload in FastAPI.

2. **Concept**: File extension validation
   - **Answer**: `ALLOWED_EXTENSIONS`
   - **Why**: We need to restrict the uploaded documents to only the supported formats (.pdf and .docx).

3. **Concept**: Text Extraction
   - **Answer**: `extract_text`
   - **Why**: This is the unified function call that delegates to either the PDF or DOCX extractor.

4. **Concept**: Pydantic Field Validation
   - **Answer**: `Field(..., min_length=2)`
   - **Why**: We require a target role string to be provided and it must have a minimum length.

5. **Concept**: Optional Type Hinting
   - **Answer**: `Optional[str]`
   - **Why**: The job description is an optional string.

6. **Concept**: Function Invocation
   - **Answer**: `resolve_role_profile`
   - **Why**: Converts the raw role string or JD into a structured requirements profile.

7. **Concept**: Dictionary Access
   - **Answer**: `"raw_text"`
   - **Why**: We need to extract the raw text content from the stored resume record to process it.

8. **Concept**: Data Pipeline Flow
   - **Answer**: `resume_text`
   - **Why**: We need to pass the raw resume text into the NLP parsing function.

9. **Concept**: Passing the Embedding Model
   - **Answer**: `app.state.encoder`
   - **Why**: We pass the SentenceTransformer encoder model from the app state so semantic similarity can be calculated.

10. **Concept**: LLM Input
    - **Answer**: `role_profile["title"]`
    - **Why**: The Gemini generation bundle requires the target role title as its first argument.

11. **Concept**: Output Assembly
    - **Answer**: `"readiness_label"`
    - **Why**: We map the readiness label calculated in the NLP stage into the final JSON response.

12. **Concept**: NLP Model Identification
    - **Answer**: `"en_core_web_sm"`
    - **Why**: This is the standard lightweight English model for spaCy used for NER.

13. **Concept**: Sentence Transformers
    - **Answer**: `"all-MiniLM-L6-v2"`
    - **Why**: This is the dense embedding model used to encode sentences for semantic comparison.


## NLP STAGE (`2_nlp.py`)

14. **Concept**: NLP Processing limit
    - **Answer**: `text[:1000]`
    - **Why**: We only run Named Entity Recognition (NER) on the first 1000 characters to find the applicant's name efficiently.

15. **Concept**: Named Entity Recognition
    - **Answer**: `"PERSON"`
    - **Why**: The spaCy entity label used for human names.

16. **Concept**: Regex Validation
    - **Answer**: `w`
    - **Why**: The fallback regex matches each individual word `w` in the split line to see if it resembles a name.

17. **Concept**: Regex escaping
    - **Answer**: `re.escape(alias)`
    - **Why**: When building regex strings from external strings, we must escape special characters to avoid regex compilation errors.

18. **Concept**: Text Search
    - **Answer**: `text_lower`
    - **Why**: We search for skills inside the lowercase version of the entire resume text.

19. **Concept**: Skill Normalization
    - **Answer**: `canonical`
    - **Why**: We add the canonical skill name (e.g., "React") to the set, not the raw alias (e.g., "reactjs").

20. **Concept**: Aliasing Dictionary
    - **Answer**: `"PostgreSQL"`
    - **Why**: Normalizes "postgres" into the canonical proper name "PostgreSQL".

21. **Concept**: Regex searching
    - **Answer**: `text`
    - **Why**: The email is searched against the full unparsed text.

22. **Concept**: Skill Extraction
    - **Answer**: `extract_skills`
    - **Why**: The function call that actually identifies tech skills inside the unstructured text.

23. **Concept**: Dictionary Comprehensions
    - **Answer**: `sections`
    - **Why**: Iterates over the raw parsed sections (lists of strings) and joins them into single continuous text blocks.

24. **Concept**: Embedding Document Generation
    - **Answer**: `resume_text`
    - **Why**: The candidate's resume text is encoded into a high-dimensional vector.

25. **Concept**: Embedding Target Generation
    - **Answer**: `profile["description"]`
    - **Why**: The job profile description is encoded into a high-dimensional vector.

26. **Concept**: Cosine Similarity Magnitude
    - **Answer**: `np.linalg.norm(b)`
    - **Why**: The denominator of cosine similarity is the magnitude of vector A multiplied by the magnitude of vector B.

27. **Concept**: Cosine Similarity Division
    - **Answer**: `denom`
    - **Why**: The dot product is divided by the denominator calculated in the previous step.

28. **Concept**: Conditional Scoring Logic
    - **Answer**: `75.0`
    - **Why**: Assigns an intermediate score if the section text length falls into the medium bucket.

29. **Concept**: Set Intersections
    - **Answer**: `all_expected`
    - **Why**: Matched skills are the intersection of the candidate's skills and the role's expected skills.

30. **Concept**: Set Differences
    - **Answer**: `all_expected`
    - **Why**: Missing skills are the role's expected skills minus the candidate's skills.

31. **Concept**: Readiness Output
    - **Answer**: `readiness_label`
    - **Why**: Assigns the human-readable string classification.


## GEMINI STAGE (`3_gemini.py`)

32. **Concept**: SDK Import
    - **Answer**: `genai`
    - **Why**: Google's modern generative AI SDK is accessed via `from google import genai`.

33. **Concept**: Environment Configuration
    - **Answer**: `"GEMINI_API_KEY"`
    - **Why**: We must read the Gemini API key from the environment securely.

34. **Concept**: Client Initialization
    - **Answer**: `GEMINI_API_KEY`
    - **Why**: The client must be initialized using the retrieved API key.

35. **Concept**: Model Selection
    - **Answer**: `"gemini-3.5-flash-lite"`
    - **Why**: This fast, cost-effective model is used to generate the career recommendation bundle.

36. **Concept**: Grounding Information
    - **Answer**: `"overall_score"`
    - **Why**: The prompt needs the overall computed NLP match score to ground its recommendations.

37. **Concept**: Persona Assignment
    - **Answer**: `target_role`
    - **Why**: The model must understand the exact role it is supposed to be advising the student about.

38. **Concept**: Structured Injection
    - **Answer**: `top_missing`
    - **Why**: We explicitly inject the top missing skills so Gemini addresses the highest-priority gaps.

39. **Concept**: Prompt Grounding Rules
    - **Answer**: `achievements`
    - **Why**: This stops the LLM from hallucinating accomplishments that aren't on the student's resume.

40. **Concept**: Generation API Call
    - **Answer**: `prompt`
    - **Why**: We pass the assembled string prompt into the `contents` argument.

41. **Concept**: Rate Limit Error Handling
    - **Answer**: `"RESOURCE_EXHAUSTED"`
    - **Why**: Catches standard Google API rate limit exceptions to safely fall back to deterministic responses.

42. **Concept**: JSON Schema Definition
    - **Answer**: `"skill"`
    - **Why**: The schema requires the specific skill name as the key in the learning recommendations.

43. **Concept**: Fallback Function Invocation
    - **Answer**: `s3`
    - **Why**: We pass the 3rd missing skill (s3) into the fallback roadmap generator.

44. **Concept**: Retry Backoff
    - **Answer**: `1.0`
    - **Why**: Sleeps for 1 second before retrying the generation on transient errors.
