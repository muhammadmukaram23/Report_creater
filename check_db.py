import asyncio
import database
from config import DB_CONFIG

async def diagnostic():
    print(f"Connecting to: {DB_CONFIG['host']}/{DB_CONFIG['db']} as {DB_CONFIG['user']}")
    await database.create_pool()
    try:
        # Raw fetch
        query = "SELECT * FROM scheme ORDER BY gs_no"
        results = await database.fetch_all(query)
        print(f"Total rows found: {len(results)}")
        for row in results:
            print(f"GS_NO: {row['gs_no']}, Name: {row['name_of_scheme']}")
            for key, val in row.items():
                print(f"  {key}: {val} ({type(val)})")
    except Exception as e:
        print(f"Error during diagnostic: {e}")
    finally:
        await database.close_pool()

if __name__ == '__main__':
    asyncio.run(diagnostic())
