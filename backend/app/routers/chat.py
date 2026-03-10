"""Router: Conversational AI Financial Assistant (Enhancement #4)"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import User
from ..schemas import (
    ChatMessageIn, ChatMessageOut, ChatSessionOut,
    ChatResponse, ChatSessionListResponse,
)
from ..dependencies import get_current_user
from ..services.chat_service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/sessions", response_model=ChatSessionOut)
async def create_session(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new conversation session."""
    session = await ChatService.create_session(db, user.id)
    return ChatSessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0,
    )


@router.get("/sessions", response_model=ChatSessionListResponse)
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversation sessions."""
    result = await ChatService.get_sessions(db, user.id)
    sessions = [
        ChatSessionOut(
            id=s["id"],
            title=s["title"],
            created_at=s["created_at"],
            updated_at=s["updated_at"],
            message_count=s["message_count"],
        )
        for s in result["sessions"]
    ]
    return ChatSessionListResponse(sessions=sessions, total=result["total"])


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
async def get_messages(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages in a session."""
    messages = await ChatService.get_session_messages(db, user.id, session_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return [ChatMessageOut.model_validate(m) for m in messages]


@router.post("/sessions/{session_id}/messages", response_model=ChatResponse)
async def send_message(
    session_id: int,
    req: ChatMessageIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message and get AI response."""
    result = await ChatService.send_message(
        db, user.id, session_id, req.message,
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return ChatResponse(
        session_id=result["session_id"],
        reply=ChatMessageOut.model_validate(result["reply"]),
        sources=result.get("sources"),
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation session."""
    success = await ChatService.delete_session(db, user.id, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True}
