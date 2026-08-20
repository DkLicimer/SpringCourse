import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from ..database import get_db
from .. import models, schemas, auth
from .notifications import add_notification

router = APIRouter(
    prefix="/surveys",
    tags=["Конструктор Анкет и Опросы"]
)

# 1. Создание Анкеты Администратором (и рассылка уведомлений всем кураторам)
@router.post("/", response_model=schemas.SurveyResponse, status_code=status.HTTP_201_CREATED)
def create_survey(
    survey_in: schemas.SurveyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    new_survey = models.Survey(
        title=survey_in.title,
        description=survey_in.description,
        is_mandatory=survey_in.is_mandatory,
        expires_at=survey_in.expires_at
    )
    db.add(new_survey)
    db.commit()
    db.refresh(new_survey)

    for q in survey_in.questions:
        new_q = models.SurveyQuestion(
            survey_id=new_survey.id,
            text=q.text,
            type=q.type,
            options=q.options
        )
        db.add(new_q)
        
    db.commit()
    db.refresh(new_survey)

    # Рассылаем уведомление: Опубликован новый опрос (Раздел 34 ТЗ)
    active_curators = db.query(models.User).filter(models.User.system_role == "USER").all()
    for curator in active_curators:
        is_curator = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.user_id == curator.id,
            models.GroupAssignment.role_code == "CURATOR",
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()

        if is_curator:
            add_notification(
                db,
                curator_id=curator.id,
                text=f"Опубликована новая анкета: '{new_survey.title}' со сроком сдачи до {new_survey.expires_at.strftime('%d.%m в %H:%M')}",
                n_type="survey"
            )

    return new_survey


@router.get("/", response_model=List[schemas.SurveyResponse])
def get_active_surveys(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    now = datetime.utcnow()
    surveys = db.query(models.Survey).filter(models.Survey.expires_at > now).all()
    
    for survey in surveys:
        survey.questions = db.query(models.SurveyQuestion).filter(
            models.SurveyQuestion.survey_id == survey.id
        ).all()
        
    return surveys


@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_survey_answers(
    submit_in: schemas.SurveySubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    survey = db.query(models.Survey).filter(models.Survey.id == submit_in.survey_id).first()
    if not survey:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Анкета не найдена")
    
    if datetime.utcnow() > survey.expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Срок прохождения истек")

    first_q_id = db.query(models.SurveyQuestion.id).filter(models.SurveyQuestion.survey_id == survey.id).first()
    if first_q_id:
        already_answered = db.query(models.SurveyAnswer).filter(
            models.SurveyAnswer.question_id == first_q_id[0],
            models.SurveyAnswer.curator_id == current_user.id
        ).first()
        if already_answered:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Вы уже проходили эту анкету"
            )

    for ans in submit_in.answers:
        question = db.query(models.SurveyQuestion).filter(
            models.SurveyQuestion.id == ans.question_id,
            models.SurveyQuestion.survey_id == survey.id
        ).first()

        if not question:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Некорректный ID вопроса")

        new_answer = models.SurveyAnswer(
            question_id=ans.question_id,
            curator_id=current_user.id,
            value=ans.value
        )
        db.add(new_answer)

    db.commit()
    return {"message": "Ответы успешно сохранены"}