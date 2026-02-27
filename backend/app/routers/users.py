from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import User
from ..schemas import UserOut, ProfileUpdate, PasswordChange
from ..auth import hash_password, verify_password
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/profile", response_model=UserOut)
async def get_profile(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.put("/profile", response_model=UserOut)
async def update_profile(
    req: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.put("/password")
async def change_password(
    req: PasswordChange,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = hash_password(req.new_password)
    await db.commit()
    return {"success": True, "message": "Password updated"}
