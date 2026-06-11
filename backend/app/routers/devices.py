"""Delivery endpoints (push tokens, telegram chats) - personal domain."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Device
from ..schemas import DeviceCreate, DeviceOut

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=list[DeviceOut])
def list_devices(user_id: int, db: Session = Depends(get_db)):
    return db.execute(
        select(Device).where(Device.user_id == user_id).order_by(Device.id)
    ).scalars().all()


@router.post("", response_model=DeviceOut)
def register_device(body: DeviceCreate, db: Session = Depends(get_db)):
    """Idempotent: re-registering the same (user, channel, ref) reactivates it."""
    existing = db.execute(
        select(Device).where(
            Device.user_id == body.user_id,
            Device.channel == body.channel,
            Device.channel_ref == body.channel_ref,
        )
    ).scalars().first()
    if existing:
        existing.is_active = True
        if body.label:
            existing.label = body.label
        db.commit()
        return existing
    device = Device(**body.model_dump())
    db.add(device)
    db.commit()
    return device


@router.delete("/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(404, "Unknown device")
    db.delete(device)
    db.commit()
    return {"ok": True}
