import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.modules.ddm.models import (
    DDMProfile, DDMFamilyMember, DDMAuditLog, DDMAuditAction
)
from app.modules.ddm.crypto import encrypt_value, decrypt_value
from app.modules.ddm import schemas
from app.modules.auth.models import User


class DDMService:
    @staticmethod
    def log_audit(
        db: Session,
        officer: User,
        action: DDMAuditAction,
        record_id: Optional[uuid.UUID],
        ip_address: Optional[str],
        details: Optional[str] = None
    ):
        """Неизменяемая фиксация действия офицера в журнале аудита 152-ФЗ"""
        log_entry = DDMAuditLog(
            user_id=officer.id,
            officer_name=officer.full_name,
            action=action,
            target_record_id=record_id,
            ip_address=ip_address,
            details=details
        )
        db.add(log_entry)
        db.commit()

    @classmethod
    def create_profile(
        cls,
        db: Session,
        data: schemas.DDMProfileCreate,
        officer: User,
        ip_address: Optional[str]
    ) -> DDMProfile:
        """Создание карточки с поколоночным шифрованием персональных данных"""
        profile = DDMProfile(
            full_name=data.full_name.strip(),
            birth_date=data.birth_date,
            phone=data.phone,
            category=data.category,
            encrypted_passport=encrypt_value(data.passport_data),
            encrypted_snils=encrypt_value(data.snils),
            encrypted_address=encrypt_value(data.residential_address),
            encrypted_document_details=encrypt_value(data.document_details),
            children_count=data.children_count,
            has_social_support=data.has_social_support,
            notes=data.notes,
            student_id=data.student_id
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Сохранение родственников (состав семьи)
        for fm in data.family_members:
            member = DDMFamilyMember(
                profile_id=profile.id,
                full_name=fm.full_name.strip(),
                relation_type=fm.relation_type,
                birth_date=fm.birth_date,
                encrypted_document_details=encrypt_value(fm.document_details),
                is_dependent=fm.is_dependent
            )
            db.add(member)
        db.commit()

        cls.log_audit(
            db, officer, DDMAuditAction.CREATE_RECORD, profile.id, ip_address,
            f"Внесена запись: {profile.full_name} ({profile.category.value})"
        )
        return profile

    @classmethod
    def get_decrypted_profile(
        cls,
        db: Session,
        profile_id: uuid.UUID,
        officer: User,
        ip_address: Optional[str]
    ) -> schemas.DDMProfileDetail:
        """Чтение карточки с расшифровкой и обязательной фиксацией факта доступа к ПДн в аудите"""
        profile = db.query(DDMProfile).filter(DDMProfile.id == profile_id, DDMProfile.is_active == True).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Карточка закрытого реестра не найдена")

        cls.log_audit(
            db, officer, DDMAuditAction.VIEW_RECORD, profile.id, ip_address,
            f"Открыт доступ к ПДн: {profile.full_name}"
        )

        family = []
        for m in profile.family_members:
            family.append(schemas.FamilyMemberResponse(
                id=m.id,
                full_name=m.full_name,
                relation_type=m.relation_type,
                birth_date=m.birth_date,
                document_details=decrypt_value(m.encrypted_document_details),
                is_dependent=m.is_dependent
            ))

        return schemas.DDMProfileDetail(
            id=profile.id,
            full_name=profile.full_name,
            birth_date=profile.birth_date,
            phone=profile.phone,
            category=profile.category,
            passport_data=decrypt_value(profile.encrypted_passport),
            snils=decrypt_value(profile.encrypted_snils),
            residential_address=decrypt_value(profile.encrypted_address),
            document_details=decrypt_value(profile.encrypted_document_details),
            children_count=profile.children_count,
            has_social_support=profile.has_social_support,
            notes=profile.notes,
            student_id=profile.student_id,
            created_at=profile.created_at,
            family_members=family
        )