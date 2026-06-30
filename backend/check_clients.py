import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.cliente import Cliente
from app.core.config import settings
from app.core.security import hash_password

async def main():
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(database=client[settings.mongo_db], document_models=[Cliente])
    
    clientes = await Cliente.find_all().to_list()
    print("----- INICIO DE CLIENTES -----")
    for c in clientes:
        print(f"Cliente encontrado: {c.email} (ID: {c.id})")
        
        # Resetear siempre a password123 para solucionar el problema del usuario
        c.password_hash = hash_password("password123")
        await c.save()
        print(f"  - Password actualizado a 'password123'")
        print(f"  - Credencial: {c.email} / password123")
    print("----- FIN DE CLIENTES -----")

if __name__ == "__main__":
    asyncio.run(main())
