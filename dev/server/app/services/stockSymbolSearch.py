from dotenv import load_dotenv
import os
import httpx

load_dotenv()
async def stockSymbolSearch(symbol):
    url = os.environ["SYMBOL_SEARCH_ENDPOINT"]
    ak = os.environ["FMP_API_KEY"]

    params = {
        "query" : symbol,
        "apikey" : ak
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)

    response.raise_for_status()
    return response.json()
