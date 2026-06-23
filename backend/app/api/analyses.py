from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, delete, select

from app.core.database import get_session
from app.models.analysis import AnalysisRecord
from app.schemas.analysis import AnalysisRead, AnalyzeTextRequest, SnapshotSaveResponse
from app.services.analyzer import analyze_resume, record_to_result, result_to_record_payload
from app.services.file_parser import extract_text
from app.services.snapshot_writer import save_analysis_snapshot

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


@router.post("/{analysis_id}/snapshot", response_model=SnapshotSaveResponse)
def save_snapshot(
    analysis_id: int,
    session: Session = Depends(get_session),
) -> SnapshotSaveResponse:
    record = session.get(AnalysisRecord, analysis_id)
    if record is None:
        raise HTTPException(status_code=404, detail="分析记录不存在。")

    analysis = AnalysisRead.model_validate(record_to_result(record))
    path = save_analysis_snapshot(analysis)
    return SnapshotSaveResponse(filename=path.name, path=str(path))


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
