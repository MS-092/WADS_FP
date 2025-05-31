import os
import uuid
import aiofiles
from typing import Optional, List
from fastapi import UploadFile, HTTPException, status
from pathlib import Path
# import magic  # Commented out for Windows compatibility
from PIL import Image
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# File storage paths
UPLOAD_DIR = Path("uploads")
CHAT_FILES_DIR = UPLOAD_DIR / "chat"
TICKET_FILES_DIR = UPLOAD_DIR / "tickets"
AVATARS_DIR = UPLOAD_DIR / "avatars"

# Create directories if they don't exist
for directory in [UPLOAD_DIR, CHAT_FILES_DIR, TICKET_FILES_DIR, AVATARS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)


class FileService:
    """
    Service for handling file uploads, validation, and storage
    """
    
    def __init__(self):
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_types = settings.ALLOWED_FILE_TYPES
    
    async def save_uploaded_file(
        self, 
        file: UploadFile, 
        destination: str = "general",
        allowed_types: Optional[List[str]] = None,
        max_size: Optional[int] = None
    ) -> dict:
        """
        Save uploaded file to storage
        
        Returns:
            dict: File info including path, size, type, etc.
        """
        try:
            # Validate file
            await self.validate_file(file, allowed_types, max_size)
            
            # Generate unique filename
            file_extension = self._get_file_extension(file.filename)
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # Determine storage path
            storage_path = self._get_storage_path(destination)
            file_path = storage_path / unique_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Get file info
            file_info = await self._get_file_info(file_path, file.filename, file.content_type)
            
            logger.info(f"File saved: {file_path}")
            return file_info
            
        except Exception as e:
            logger.error(f"Error saving file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file: {str(e)}"
            )
    
    async def save_chat_file(self, file: UploadFile) -> dict:
        """Save file for chat messages"""
        chat_allowed_types = [
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf", "text/plain", 
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]
        
        return await self.save_uploaded_file(
            file, 
            destination="chat",
            allowed_types=chat_allowed_types,
            max_size=10 * 1024 * 1024  # 10MB for chat files
        )
    
    async def save_ticket_attachment(self, file: UploadFile) -> dict:
        """Save file for ticket attachments"""
        return await self.save_uploaded_file(
            file,
            destination="tickets",
            max_size=20 * 1024 * 1024  # 20MB for ticket attachments
        )
    
    async def save_avatar(self, file: UploadFile) -> dict:
        """Save user avatar image"""
        avatar_allowed_types = ["image/jpeg", "image/png", "image/webp"]
        
        file_info = await self.save_uploaded_file(
            file,
            destination="avatars",
            allowed_types=avatar_allowed_types,
            max_size=2 * 1024 * 1024  # 2MB for avatars
        )
        
        # Create thumbnail for avatar
        await self._create_avatar_thumbnail(file_info["file_path"])
        
        return file_info
    
    async def validate_file(
        self, 
        file: UploadFile, 
        allowed_types: Optional[List[str]] = None,
        max_size: Optional[int] = None
    ):
        """Validate uploaded file"""
        
        # Check file size
        max_size = max_size or self.max_file_size
        if file.size and file.size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size {file.size} exceeds maximum allowed size {max_size} bytes"
            )
        
        # Check content type
        allowed_types = allowed_types or self.allowed_types
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"File type {file.content_type} not allowed. Allowed types: {allowed_types}"
            )
        
        # Basic file validation using file extension and content type
        # Replaced python-magic for Windows compatibility
        try:
            file_content = await file.read()
            await file.seek(0)  # Reset file pointer
            
            # Basic validation - check if file extension matches content type
            file_extension = self._get_file_extension(file.filename).lower()
            expected_content_types = self._get_expected_content_types(file_extension)
            
            if file.content_type not in expected_content_types:
                logger.warning(f"File type mismatch: extension={file_extension}, content_type={file.content_type}")
                # For development, we'll log this but not reject the file
                
        except Exception as e:
            logger.warning(f"Could not validate file type: {e}")
    
    def _get_expected_content_types(self, file_extension: str) -> List[str]:
        """Get expected content types for a file extension"""
        extension_map = {
            '.jpg': ['image/jpeg'],
            '.jpeg': ['image/jpeg'],
            '.png': ['image/png'],
            '.gif': ['image/gif'],
            '.webp': ['image/webp'],
            '.pdf': ['application/pdf'],
            '.txt': ['text/plain'],
            '.doc': ['application/msword'],
            '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            '.xls': ['application/vnd.ms-excel'],
            '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        }
        return extension_map.get(file_extension, [])
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from storage"""
        try:
            full_path = Path(file_path)
            if full_path.exists():
                full_path.unlink()
                logger.info(f"File deleted: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {e}")
            return False
    
    async def get_file_url(self, file_path: str, file_type: str = "general") -> str:
        """Generate URL for file access"""
        # This would typically generate a URL that can be served by FastAPI
        # For now, we'll return a simple path-based URL
        return f"/api/v1/files/{file_type}/{Path(file_path).name}"
    
    def _get_storage_path(self, destination: str) -> Path:
        """Get storage path based on destination"""
        paths = {
            "chat": CHAT_FILES_DIR,
            "tickets": TICKET_FILES_DIR,
            "avatars": AVATARS_DIR,
            "general": UPLOAD_DIR
        }
        return paths.get(destination, UPLOAD_DIR)
    
    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension from filename"""
        if not filename:
            return ""
        return Path(filename).suffix.lower()
    
    async def _get_file_info(self, file_path: Path, original_filename: str, content_type: str) -> dict:
        """Get file information"""
        stat = file_path.stat()
        
        return {
            "file_path": str(file_path),
            "filename": file_path.name,
            "original_filename": original_filename,
            "size": stat.st_size,
            "content_type": content_type,
            "url": await self.get_file_url(str(file_path)),
            "created_at": stat.st_ctime
        }
    
    async def _create_avatar_thumbnail(self, file_path: str, size: tuple = (150, 150)):
        """Create thumbnail for avatar images"""
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary (for PNG with transparency)
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Create thumbnail
                img.thumbnail(size, Image.Resampling.LANCZOS)
                
                # Save thumbnail
                thumbnail_path = str(file_path).replace('.', '_thumb.')
                img.save(thumbnail_path, 'JPEG', quality=85)
                
                logger.info(f"Avatar thumbnail created: {thumbnail_path}")
                
        except Exception as e:
            logger.error(f"Error creating avatar thumbnail: {e}")
    
    async def cleanup_temp_files(self, older_than_hours: int = 24):
        """Clean up temporary files older than specified hours"""
        try:
            import time
            current_time = time.time()
            cutoff_time = current_time - (older_than_hours * 3600)
            
            temp_dirs = [UPLOAD_DIR / "temp"]
            
            for temp_dir in temp_dirs:
                if temp_dir.exists():
                    for file_path in temp_dir.rglob("*"):
                        if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                            file_path.unlink()
                            logger.info(f"Cleaned up temp file: {file_path}")
                            
        except Exception as e:
            logger.error(f"Error during temp file cleanup: {e}")


# Global file service instance
file_service = FileService()


# File type detection utilities
def is_image(content_type: str) -> bool:
    """Check if file is an image"""
    return content_type.startswith('image/')

def is_document(content_type: str) -> bool:
    """Check if file is a document"""
    document_types = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
    return content_type in document_types

def get_file_category(content_type: str) -> str:
    """Get file category based on content type"""
    if is_image(content_type):
        return "image"
    elif is_document(content_type):
        return "document"
    else:
        return "file" 