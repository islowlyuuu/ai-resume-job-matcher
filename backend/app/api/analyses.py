from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, delete, select

from app.core.database import get_session
from app.models.analysis import AnalysisRecord
from app.schemas.analysis import AnalysisRead, AnalyzeTextRequest
from app.services.analyzer import analyze_resume, record_to_result, result_to_record_payload
from app.services.file_parser import extract_text

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("", response_model=list[AnalysisRead])
def list_analyses(session: Session = Depends(get_session)) -> list[dict]:
    records = session.exec(
        select(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(20)
    ).all()
    return [record_to_result(record) for record in records]


@router.delete("")
def clear_analyses(session: Session = Depends(get_session)) -> dict[str, int]:
    result = session.exec(delete(AnalysisRecord))
    session.commit()
    return {"deleted": result.rowcount or 0}


@router.post("/text", response_model=AnalysisRead)
async def analyze_text(
    payload: AnalyzeTextRequest,
    session: Session = Depends(get_session),
) -> dict:
    result = await analyze_resume(payload.resume_text, payload.job_description)
    record = AnalysisRecord(
        **result_to_record_payload(result, payload.resume_text, payload.job_description)
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record_to_result(record)


@router.post("/upload", response_model=AnalysisRead)
async def analyze_upload(
    job_description: str = Form(...),
    resume: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> dict:
    try:
        resume_text = await extract_text(resume)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if len(resume_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="无法从文件中提取足够的简历文本。")

    result = await analyze_resume(resume_text, job_description)
    record = AnalysisRecord(
        **result_to_record_payload(result, resume_text, job_description)
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record_to_result(record)
