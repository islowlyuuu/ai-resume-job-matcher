from app.skills import build_skill_prompt, load_skills


def test_default_skills_are_loaded():
    skills = load_skills()
    names = {skill.name for skill in skills}

    assert {"jd_matching", "resume_rewrite", "resume_formatting", "boss_opener"} <= names
    assert all(skill.content for skill in skills)


def test_skill_prompt_wraps_each_skill():
    prompt = build_skill_prompt(("resume_formatting", "boss_opener"))

    assert '<skill name="resume_formatting">' in prompt
    assert '<skill name="boss_opener">' in prompt
    assert "Word 或 PDF" in prompt
    assert "Boss 直聘" in prompt
