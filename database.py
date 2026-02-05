import aiomysql
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from config import DB_CONFIG

# Global connection pool
pool: Optional[aiomysql.Pool] = None


async def create_pool():
    """Create database connection pool"""
    global pool
    pool = await aiomysql.create_pool(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        db=DB_CONFIG['db'],
        charset=DB_CONFIG['charset'],
        autocommit=DB_CONFIG['autocommit'],
        minsize=1,
        maxsize=10
    )
    return pool


async def close_pool():
    """Close database connection pool"""
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()


@asynccontextmanager
async def get_db_connection():
    """Context manager for database connections"""
    global pool
    if not pool:
        await create_pool()
    
    async with pool.acquire() as conn:
        yield conn


async def execute_query(query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False) -> Any:
    """
    Execute a SQL query and return results
    
    Args:
        query: SQL query string
        params: Query parameters tuple
        fetch_one: If True, fetch single row
        fetch_all: If True, fetch all rows
        
    Returns:
        Query result or None
    """
    async with get_db_connection() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute(query, params or ())
            
            if fetch_one:
                return await cursor.fetchone()
            elif fetch_all:
                return await cursor.fetchall()
            else:
                await conn.commit()
                return cursor.lastrowid


async def execute_many(query: str, params_list: List[tuple]) -> int:
    """
    Execute a SQL query with multiple parameter sets
    
    Args:
        query: SQL query string
        params_list: List of parameter tuples
        
    Returns:
        Number of affected rows
    """
    async with get_db_connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.executemany(query, params_list)
            await conn.commit()
            return cursor.rowcount


async def fetch_one(query: str, params: tuple = None) -> Optional[Dict]:
    """Fetch single row"""
    return await execute_query(query, params, fetch_one=True)


async def fetch_all(query: str, params: tuple = None) -> List[Dict]:
    """Fetch all rows"""
    result = await execute_query(query, params, fetch_all=True)
    return result if result else []


async def execute(query: str, params: tuple = None) -> Any:
    """Execute query without fetching results"""
    return await execute_query(query, params)
