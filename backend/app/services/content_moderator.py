import hashlib
import re
from typing import TypedDict


class ModerationResult(TypedDict):
    is_spam: bool
    spam_reason: str | None
    harm_score: int
    severity_suggested: str
    flags: list[str]
    requires_intervention: bool
    executive_summary_preview: str


# Spam indicators
SPAM_PATTERNS = [
    re.compile(r"(?i)\b(free money|click here|crypto giveaway|bitcoin|make \$\d+|casino|earn fast cash)\b"),
    re.compile(r"(?i)\b(buy now|discount code|telegram:\s*@|whatsapp:\s*\+?\d{8,})\b"),
    re.compile(r"(https?://\S+|www\.\S+)"),  # Suspicious unsolicited URLs
]

# Harmful & critical threat categories
HARM_PATTERNS = {
    "threat_violence": [
        re.compile(r"(?i)\b(kill|murder|shoot|bomb|assault|physically harm|attack|stab|weapon|gun|knife)\b"),
        "Potential threat of violence or physical harm",
    ],
    "severe_harassment": [
        re.compile(r"(?i)\b(extort|blackmail|doxx|stalking|sexual harassment|groping|coercion|retaliate against me)\b"),
        "Severe harassment, stalking, or retaliatory intimidation",
    ],
    "safety_critical": [
        re.compile(r"(?i)\b(toxic leak|chemical spill|fire hazard|locked emergency|structural collapse|radiation|explosion hazard|bypass safety interlock)\b"),
        "Critical occupational safety hazard / mishap risk",
    ],
    "corporate_fraud": [
        re.compile(r"(?i)\b(embezzl|money laundering|shredding documents|bribe|falsifying accounting|insider trading|forged audit)\b"),
        "Serious financial fraud / illegal corporate misconduct",
    ],
}


def analyze_content(title: str, description: str, category: str) -> ModerationResult:
    """
    Analyzes submitted text for spam, threat signals, and critical safety hazards.
    Does NOT store any submitter metadata.
    """
    combined = f"{title}\n{description}".strip()
    flags: list[str] = []
    harm_score = 0
    is_spam = False
    spam_reason = None

    # 1. Spam checks
    # Character repetition (e.g., 'aaaaaaa', '!!!!!!!!!')
    if re.search(r"(.)\1{7,}", combined):
        is_spam = True
        spam_reason = "Excessive repeated character sequences detected."

    # Word repetition
    words = combined.lower().split()
    if len(words) > 10:
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio < 0.25:
            is_spam = True
            spam_reason = "Unusually high word repetition."

    # Spam keywords & external phishing URLs
    for pattern in SPAM_PATTERNS:
        if pattern.search(combined):
            is_spam = True
            spam_reason = "Matches known spam or unsolicited promotion patterns."
            break

    # 2. Harm & Threat Analysis
    for flag_id, (pattern, description_text) in HARM_PATTERNS.items():
        matches = pattern.findall(combined)
        if matches:
            flags.append(description_text)
            if flag_id == "threat_violence":
                harm_score += 45
            elif flag_id == "safety_critical":
                harm_score += 40
            elif flag_id == "severe_harassment":
                harm_score += 35
            elif flag_id == "corporate_fraud":
                harm_score += 30

    # High severity boost if category is safety or harassment
    if category in ("safety", "harassment") and len(flags) > 0:
        harm_score = min(100, harm_score + 15)

    harm_score = min(100, harm_score)

    # Determine severity
    if harm_score >= 70:
        severity_suggested = "critical"
    elif harm_score >= 40:
        severity_suggested = "high"
    elif harm_score >= 20:
        severity_suggested = "medium"
    else:
        severity_suggested = "low"

    requires_intervention = harm_score >= 65 or any("Critical occupational safety" in f for f in flags)

    # Auto-generate a clean, sanitized executive summary preview for Ombudsman moderation
    clean_title = title.strip()
    preview = (
        f"Category: {category.capitalize()} | Incident Summary: {clean_title}. "
        f"Automated risk evaluation assigned harm score of {harm_score}/100 ({severity_suggested} priority). "
        f"Flags raised: {', '.join(flags) if flags else 'None detected'}."
    )

    return {
        "is_spam": is_spam,
        "spam_reason": spam_reason,
        "harm_score": harm_score,
        "severity_suggested": severity_suggested,
        "flags": flags,
        "requires_intervention": requires_intervention,
        "executive_summary_preview": preview,
    }


def compute_duplicate_fingerprint(company_name: str, category: str, title: str, description: str) -> str:
    """
    Computes a privacy-preserving normalized content fingerprint.
    Normalizes words (lowercased, alphanumeric only, stemmed tokens) so minor edits or spacing
    changes of the exact same report produce an identical fingerprint to stop duplicate floods.
    """
    norm_comp = (company_name or "").lower().strip()
    norm_cat = (category or "").lower().strip()

    # Extract alphanumeric words longer than 3 chars
    words = re.findall(r"\b[a-zA-Z0-9]{4,}\b", f"{title} {description}".lower())
    # Take first 40 sorted distinct meaningful words
    unique_tokens = sorted(set(words))[:40]
    canonical_str = f"{norm_comp}|{norm_cat}|{' '.join(unique_tokens)}"
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
