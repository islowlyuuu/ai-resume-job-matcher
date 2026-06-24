from dataclasses import dataclass
from pathlib import Path


SKILLS_DIR = Path(__file__).resolve().parent
DEFAULT_SKILLS = (
    "jd_matching",
    "resume_rewrite",
    "resume_formatting",
    "boss_opener",
)


@dataclass(frozen=True)
class Skill:
    name: str
    content: str


def load_skills(names: tuple[str, ...] = DEFAULT_SKILLS) -> list[Skill]:
    skills: list[Skill] = []
    for name in names:
        path = SKILLS_DIR / f"{name}.md"
        if not path.exists():
            continue
        skills.append(Skill(name=name, content=path.read_text(encoding="utf-8").strip()))
    return skills


def build_skill_prompt(names: tuple[str, ...] = DEFAULT_SKILLS) -> str:
    skills = load_skills(names)
    if not skills:
        return ""
    sections = ["下面是本次分析可使用的技能说明，请按需遵循："]
    for skill in skills:
        sections.append(f"\n<skill name=\"{skill.name}\">\n{skill.content}\n</skill>")
    return "\n".join(sections)
