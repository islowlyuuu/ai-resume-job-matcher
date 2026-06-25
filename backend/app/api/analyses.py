from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlmodel import Session, delete, select

from app.core.database import get_session
from app.models.analysis import AnalysisRecord
from app.schemas.analysis import (
    AnalysisRead,
    AnalyzeTextRequest,
    ProviderStatus,
    ResumeTextExtractResponse,
    SnapshotSaveResponse,
)
from app.services.analyzer import (
    analyze_resume,
    get_provider_status,
    record_to_result,
    result_to_record_payload,
)
from app.services.exporter import build_pdf_bytes, build_resume_docx
from app.services.file_parser import extract_text
from app.services.snapshot_writer import save_analysis_snapshot

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("/providers", response_model=list[ProviderStatus])
def list_providers() -> list[dict[str, object]]:
    return get_provider_status()


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


@router.get("/{analysis_id}/export/docx")
def export_docx(
    analysis_id: int,
    session: Session = Depends(get_session),
) -> Response:
    analysis = _get_analysis_or_404(analysis_id, session)
    filename = quote(f"{analysis.candidate_name}_{analysis.job_title}_optimized.docx")
    return Response(
        content=build_resume_docx(analysis),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


@router.get("/{analysis_id}/export/pdf")
def export_pdf(
    analysis_id: int,
    session: Session = Depends(get_session),
) -> Response:
    analysis = _get_analysis_or_404(analysis_id, session)
    try:
        content = build_pdf_bytes(analysis)
    except RuntimeError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    filename = quote(f"{analysis.candidate_name}_{analysis.job_title}_optimized.pdf")
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


@router.post("/text", response_model=AnalysisRead)
async def analyze_text(
    payload: AnalyzeTextRequest,
    session: Session = Depends(get_session),
) -> dict:
    result = await analyze_resume(
        payload.resume_text,
        payload.job_description,
        payload.output_mode,
        payload.provider,
    )
    record = AnalysisRecord(
        **result_to_record_payload(result, payload.resume_text, payload.job_description)
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record_to_result(record)


@router.post("/extract-resume", response_model=ResumeTextExtractResponse)
async def extract_resume_text(
    resume: UploadFile = File(...),
) -> ResumeTextExtractResponse:
    try:
        resume_text = await extract_text(resume)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if len(resume_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="无法从文件中提取足够的简历文本。")

    return ResumeTextExtractResponse(resume_text=resume_text)


@router.post("/upload", response_model=AnalysisRead)
async def analyze_upload(
    job_description: str = Form(...),
    output_mode: str = Form("boss"),
    provider: str = Form("default"),
    resume: UploadFile = File(...),
    session: Session = Depends(get_session),
) -> dict:
    try:
        resume_text = await extract_text(resume)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if len(resume_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="无法从文件中提取足够的简历文本。")

    result = await analyze_resume(resume_text, job_description, output_mode, provider)
    record = AnalysisRecord(
        **result_to_record_payload(result, resume_text, job_description)
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record_to_result(record)


def _get_analysis_or_404(analysis_id: int, session: Session) -> AnalysisRead:
    record = session.get(AnalysisRecord, analysis_id)
    if record is None:
        raise HTTPException(status_code=404, detail="分析记录不存在。")
    return AnalysisRead.model_validate(record_to_result(record))
