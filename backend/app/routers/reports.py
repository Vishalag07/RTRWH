from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session
from jinja2 import Environment, FileSystemLoader, select_autoescape
from xhtml2pdf import pisa
import io
import os

from app.db import get_db
from app.models import Assessment
from app.security import get_current_user_email
from app.settings import get_settings

try:
	from openai import OpenAI
except Exception:  # pragma: no cover
	OpenAI = None


router = APIRouter()

templates_env = Environment(
	loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "..", "templates")),
	autoescape=select_autoescape(["html", "xml"]),
)


@router.get("/reports/{assessment_id}.pdf")
def download_pdf(assessment_id: int, db: Session = Depends(get_db), user_email: str = Depends(get_current_user_email)):
	a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
	if not a:
		return Response(status_code=404)
	template = templates_env.get_template("report.html")
	html_content = template.render(assessment=a, ai_commentary=None)
	out = io.BytesIO()
	pisa.CreatePDF(src=html_content, dest=out)
	headers = {"Content-Disposition": f"attachment; filename=assessment_{assessment_id}.pdf"}
	return Response(content=out.getvalue(), media_type="application/pdf", headers=headers)


@router.get("/reports/{assessment_id}/ai.pdf")
def download_pdf_ai(assessment_id: int, db: Session = Depends(get_db), user_email: str = Depends(get_current_user_email)):
	a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
	if not a:
		return Response(status_code=404)

	settings = get_settings()
	if not settings.openai_api_key or OpenAI is None:
		raise HTTPException(status_code=400, detail="OpenAI not configured")

	client = OpenAI(api_key=settings.openai_api_key)
	# Summarize and recommend improvements
	prompt = (
		"You are a civil/water engineer. Based on the following assessment JSON, write "
		"a concise paragraph (120-180 words) summarizing recharge potential, risks, and 2-3 actionable improvements.\n\n"
		f"Assessment: {a.results}"
	)
	try:
		resp = client.chat.completions.create(
			model=settings.openai_model,
			messages=[
				{"role": "system", "content": "Provide pragmatic, safe hydrology guidance."},
				{"role": "user", "content": prompt},
			],
			temperature=0.4,
			max_tokens=300,
		)
		ai_text = resp.choices[0].message.content if resp and resp.choices else ""
	except Exception as e:  # fallback without AI
		msg = str(e)
		if ("insufficient_quota" in msg) or ("429" in msg) or ("rate limit" in msg.lower()):
			ai_text = (
				"AI commentary unavailable due to usage limits. Provide a brief summary manually: "
				"include recharge potential, key risks (clogging/overflow/contamination), and 2-3 actionable improvements."
			)
		else:
			ai_text = "AI commentary unavailable."

	template = templates_env.get_template("report.html")
	html_content = template.render(assessment=a, ai_commentary=ai_text)
	out = io.BytesIO()
	pisa.CreatePDF(src=html_content, dest=out)
	headers = {"Content-Disposition": f"attachment; filename=assessment_{assessment_id}_ai.pdf"}
	return Response(content=out.getvalue(), media_type="application/pdf", headers=headers)


@router.get("/reports/{assessment_id}/guide.pdf")
def download_pdf_guide(assessment_id: int, db: Session = Depends(get_db), user_email: str = Depends(get_current_user_email)):
	a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
	if not a:
		return Response(status_code=404)

	# Determine feasibility: simple check comparing runoff vs storage potential
	runoff = float(a.results.get('runoff', {}).get('annual_runoff_volume_liters', 0))
	storage = float(a.results.get('structure', {}).get('storage_volume_liters', 0))
	feasible = runoff > 0 and storage > 0

	ai_steps = ""
	if feasible:
		settings = get_settings()
		if not settings.openai_api_key or OpenAI is None:
			ai_steps = "AI not configured. Provide generic steps: site marking, silt trap, excavation, filter media layering (coarse->fine), recharge pit/trench construction, inlet/outlet protection, first-flush/diverter, signage, O&M schedule."
		else:
			client = OpenAI(api_key=settings.openai_api_key)
			prompt = (
				"Create a clear, numbered step-by-step implementation guide (8-12 steps) for rooftop rainwater harvesting and artificial recharge based on this assessment JSON. Include safety and O&M notes. Keep steps short and actionable.\n\n"
				f"Assessment: {a.results}"
			)
			try:
				resp = client.chat.completions.create(
					model=settings.openai_model,
					messages=[
						{"role": "system", "content": "You are a senior hydrology engineer. Be precise and practical."},
						{"role": "user", "content": prompt},
					],
					temperature=0.3,
					max_tokens=600,
				)
				ai_steps = resp.choices[0].message.content if resp and resp.choices else ""
			except Exception as e:
				msg = str(e)
				if ("insufficient_quota" in msg) or ("429" in msg) or ("rate limit" in msg.lower()):
					ai_steps = (
						"AI steps unavailable due to usage limits. Use generic steps: site marking; silt trap; "
						"excavation; filter media layering (coarse->fine); recharge pit/trench construction; inlet/outlet protection; "
						"first-flush/diverter; signage; O&M schedule including periodic desilting and water quality checks."
					)
				else:
					ai_steps = "AI steps unavailable."

	template = templates_env.get_template("guide.html")
	html_content = template.render(assessment=a, feasible=feasible, ai_steps=ai_steps)
	out = io.BytesIO()
	pisa.CreatePDF(src=html_content, dest=out)
	headers = {"Content-Disposition": f"attachment; filename=assessment_{assessment_id}_guide.pdf"}
	return Response(content=out.getvalue(), media_type="application/pdf", headers=headers)


