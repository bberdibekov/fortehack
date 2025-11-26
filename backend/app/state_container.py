from app.infrastructure.persistence.memory import MemorySessionRepository

# Global Singleton for the application lifespan
session_repository = MemorySessionRepository()