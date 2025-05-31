from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
import mimetypes
import os
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user
from app.core.files import file_service, UPLOAD_DIR, CHAT_FILES_DIR, TICKET_FILES_DIR, AVATARS_DIR
from app.models.user import User
from app.models.ticket import Attachment

router = APIRouter()


@router.post("/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload user avatar image
    """
    try:
        file_info = await file_service.save_avatar(file)
        
        # Update user's avatar URL
        current_user.avatar_url = file_info["url"]
        db.commit()
        
        return {
            "message": "Avatar uploaded successfully",
            "avatar_url": file_info["url"],
            "file_info": file_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )


@router.post("/upload/ticket-attachment")
async def upload_ticket_attachment(
    ticket_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload file attachment for ticket
    """
    from app.models.ticket import Ticket
    
    # Check if ticket exists and user has access
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    from app.models.user import UserRole
    can_attach = (
        current_user.role in [UserRole.ADMIN, UserRole.SUPPORT_AGENT] or
        ticket.user_id == current_user.id or
        ticket.assigned_to == current_user.id
    )
    
    if not can_attach:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to attach files to this ticket"
        )
    
    try:
        file_info = await file_service.save_ticket_attachment(file)
        
        # Create attachment record
        attachment = Attachment(
            filename=file_info["filename"],
            original_filename=file_info["original_filename"],
            file_path=file_info["file_path"],
            file_size=file_info["size"],
            content_type=file_info["content_type"],
            ticket_id=ticket_id,
            uploaded_by=current_user.id
        )
        
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        
        return {
            "message": "File attached to ticket successfully",
            "attachment_id": attachment.id,
            "file_info": file_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload attachment: {str(e)}"
        )


@router.post("/upload/chat")
async def upload_chat_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload file for chat messages
    """
    try:
        file_info = await file_service.save_chat_file(file)
        
        return {
            "message": "Chat file uploaded successfully",
            "file_info": file_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload chat file: {str(e)}"
        )


@router.get("/serve/avatars/{filename}")
async def serve_avatar(filename: str):
    """
    Serve avatar image files
    """
    file_path = AVATARS_DIR / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get MIME type
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = "application/octet-stream"
    
    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        filename=filename
    )


@router.get("/serve/chat/{filename}")
async def serve_chat_file(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """
    Serve chat files (authentication required)
    """
    file_path = CHAT_FILES_DIR / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get MIME type
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = "application/octet-stream"
    
    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        filename=filename
    )


@router.get("/serve/tickets/{filename}")
async def serve_ticket_file(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Serve ticket attachment files (with permission check)
    """
    file_path = TICKET_FILES_DIR / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Find attachment record to check permissions
    attachment = db.query(Attachment).filter(
        Attachment.filename == filename
    ).first()
    
    if attachment:
        from app.models.ticket import Ticket
        from app.models.user import UserRole
        
        ticket = db.query(Ticket).filter(Ticket.id == attachment.ticket_id).first()
        
        # Check permissions
        can_access = (
            current_user.role in [UserRole.ADMIN, UserRole.SUPPORT_AGENT] or
            ticket.user_id == current_user.id or
            ticket.assigned_to == current_user.id
        )
        
        if not can_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this file"
            )
    
    # Get MIME type
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = "application/octet-stream"
    
    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        filename=attachment.original_filename if attachment else filename
    )


@router.get("/attachments/{attachment_id}")
async def download_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download ticket attachment by ID
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )
    
    # Check permissions
    from app.models.ticket import Ticket
    from app.models.user import UserRole
    
    ticket = db.query(Ticket).filter(Ticket.id == attachment.ticket_id).first()
    
    can_access = (
        current_user.role in [UserRole.ADMIN, UserRole.SUPPORT_AGENT] or
        ticket.user_id == current_user.id or
        ticket.assigned_to == current_user.id
    )
    
    if not can_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this attachment"
        )
    
    file_path = Path(attachment.file_path)
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    return FileResponse(
        path=str(file_path),
        media_type=attachment.content_type,
        filename=attachment.original_filename,
        headers={"Content-Disposition": f"attachment; filename={attachment.original_filename}"}
    )


@router.delete("/attachments/{attachment_id}")
async def delete_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete ticket attachment
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )
    
    # Check permissions (only uploader, ticket owner, assigned agent, or admin)
    from app.models.ticket import Ticket
    from app.models.user import UserRole
    
    ticket = db.query(Ticket).filter(Ticket.id == attachment.ticket_id).first()
    
    can_delete = (
        current_user.role == UserRole.ADMIN or
        attachment.uploaded_by == current_user.id or
        ticket.user_id == current_user.id or
        ticket.assigned_to == current_user.id
    )
    
    if not can_delete:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this attachment"
        )
    
    # Delete file from disk
    file_deleted = await file_service.delete_file(attachment.file_path)
    
    # Delete attachment record
    db.delete(attachment)
    db.commit()
    
    return {
        "message": "Attachment deleted successfully",
        "file_deleted": file_deleted
    }


@router.get("/cleanup/temp")
async def cleanup_temp_files(
    older_than_hours: int = 24,
    current_user: User = Depends(get_admin_user)
):
    """
    Clean up temporary files (Admin only)
    """
    try:
        await file_service.cleanup_temp_files(older_than_hours)
        return {"message": f"Cleanup completed for files older than {older_than_hours} hours"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleanup failed: {str(e)}"
        )


@router.get("/stats")
async def get_file_stats(
    current_user: User = Depends(get_admin_user)
):
    """
    Get file storage statistics (Admin only)
    """
    try:
        def get_dir_size(path: Path) -> int:
            """Calculate directory size recursively"""
            total = 0
            for entry in path.rglob("*"):
                if entry.is_file():
                    total += entry.stat().st_size
            return total
        
        def count_files(path: Path) -> int:
            """Count files in directory recursively"""
            return len([f for f in path.rglob("*") if f.is_file()])
        
        stats = {
            "total_size_bytes": get_dir_size(UPLOAD_DIR),
            "total_files": count_files(UPLOAD_DIR),
            "by_category": {
                "avatars": {
                    "size_bytes": get_dir_size(AVATARS_DIR),
                    "files": count_files(AVATARS_DIR)
                },
                "chat_files": {
                    "size_bytes": get_dir_size(CHAT_FILES_DIR),
                    "files": count_files(CHAT_FILES_DIR)
                },
                "ticket_attachments": {
                    "size_bytes": get_dir_size(TICKET_FILES_DIR),
                    "files": count_files(TICKET_FILES_DIR)
                }
            }
        }
        
        # Convert bytes to human readable format
        def format_bytes(bytes_size):
            for unit in ['B', 'KB', 'MB', 'GB']:
                if bytes_size < 1024.0:
                    return f"{bytes_size:.1f} {unit}"
                bytes_size /= 1024.0
            return f"{bytes_size:.1f} TB"
        
        stats["total_size_formatted"] = format_bytes(stats["total_size_bytes"])
        for category in stats["by_category"]:
            stats["by_category"][category]["size_formatted"] = format_bytes(
                stats["by_category"][category]["size_bytes"]
            )
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file stats: {str(e)}"
        ) 