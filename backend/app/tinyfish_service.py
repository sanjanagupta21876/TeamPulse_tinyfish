import logging
import httpx
from typing import List, Dict, Any, Optional
from .config import settings

logger = logging.getLogger("teampulse.tinyfish")

# Curated, authentic technical documentation for demo fallback (used ONLY when TINYFISH_API_KEY is unset or API unreachable)
DEMO_FALLBACK_SOURCES = [
    {
        "title": "FastAPI: Response Model and Data Filtering Documentation",
        "url": "https://fastapi.tiangolo.com/tutorial/response-model/",
        "domain": "fastapi.tiangolo.com",
        "snippet": "Declare the return type of a path operation using response_model to enforce strict JSON contract validation, schema documentation, and prevent unexpected payload fields.",
        "fetched_content": "# Response Model - Return Type\n\nYou can declare the type used for the response by declaring the type annotation of the function return type or using the `response_model` parameter in any of the path operations.\n\n### Why Use Response Models?\n- **Automatic Data Validation**: FastAPI validates that the returned data matches the declared Pydantic schema.\n- **Schema Documentation**: Automatically generates OpenAPI documentation for frontend consumers.\n- **Mock Compatibility**: Provides an unambiguous single source of truth for mock servers.",
        "is_live": False,
        "provider": "Curated Demo Mode (TinyFish Key Not Configured)"
    },
    {
        "title": "Stoplight Prism: Instant HTTP Mock Servers from OpenAPI Contracts",
        "url": "https://stoplight.io/open-source/prism",
        "domain": "stoplight.io",
        "snippet": "Prism is an open-source HTTP mock server that generates real mock responses directly from your OpenAPI contract, unblocking frontend engineers immediately while backend builds.",
        "fetched_content": "# Stoplight Prism\n\nPrism turns any OpenAPI v2 or v3 contract into a running HTTP mock server within seconds.\n\n### Benefits for Blocked Teams:\n1. **Zero Backend Dependency**: Frontend engineers can send real HTTP requests to `http://localhost:4010` and get schema-compliant mock data.\n2. **Early Contract Negotiation**: Catches discrepancies between frontend payload expectations and backend specifications before final code integration.\n3. **Command line run**: `npx @stoplight/prism-cli mock openapi.json`",
        "is_live": False,
        "provider": "Curated Demo Mode (TinyFish Key Not Configured)"
    },
    {
        "title": "HTTP 422 Unprocessable Entity & Pydantic Request Validation Guide",
        "url": "https://docs.pydantic.dev/latest/concepts/models/",
        "domain": "docs.pydantic.dev",
        "snippet": "Troubleshooting request body validation failures: common causes include missing required keys, string/integer type coercion issues, and datetime ISO-8601 parsing mismatches.",
        "fetched_content": "# Pydantic Model Validation\n\nWhen a REST endpoint returns HTTP 422 Unprocessable Entity, inspect the `detail` array in the response body.\n\n### Common Integration Failures:\n- Field missing in request body (e.g. `loc: ['body', 'userId']`).\n- Type mismatch (e.g. string expected but array/null provided).\n- Trailing slashes in URL routing causing redirect dropping body payloads.",
        "is_live": False,
        "provider": "Curated Demo Mode (TinyFish Key Not Configured)"
    }
]

class TinyFishService:
    def __init__(self):
        self.api_key = settings.TINYFISH_API_KEY
        self.search_url = settings.TINYFISH_SEARCH_URL
        self.fetch_url = settings.TINYFISH_FETCH_URL

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "YOUR_TINYFISH_API_KEY_HERE")

    async def search(
        self,
        query: str,
        purpose: Optional[str] = None,
        fetch_top_url: bool = True
    ) -> Dict[str, Any]:
        """
        Executes web research via TinyFish Search and Fetch APIs.
        If TINYFISH_API_KEY is not configured or network error occurs,
        returns transparently labeled fallback sources without crashing.
        """
        if not self.is_configured():
            logger.info("TINYFISH_API_KEY not configured. Using transparent demo fallback mode.")
            return {
                "is_live": False,
                "provider": "DEMO MODE (TINYFISH_API_KEY not configured in environment)",
                "query": query,
                "message": "Demo mode active: To enable live web research, set TINYFISH_API_KEY in your .env or backend environment. Showing curated technical guidance.",
                "sources": DEMO_FALLBACK_SOURCES
            }

        headers = {
            "X-API-Key": self.api_key,
            "User-Agent": "TeamPulse-RecoveryEngine/1.0"
        }
        params = {
            "query": query,
            "purpose": purpose or "Investigate technical blockers and API contract recovery strategies for software projects.",
            "location": "US",
            "language": "en"
        }

        try:
            logger.info(f"Calling TinyFish Search API: {self.search_url} with query='{query}'")
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.get(self.search_url, headers=headers, params=params)
                
                if resp.status_code != 200:
                    logger.warning(f"TinyFish Search API returned HTTP {resp.status_code}: {resp.text}")
                    return {
                        "is_live": False,
                        "provider": f"TINYFISH ERROR (HTTP {resp.status_code}) - Fallback Activated",
                        "query": query,
                        "message": f"TinyFish Search API responded with status {resp.status_code}. Using fallback technical guidance.",
                        "sources": DEMO_FALLBACK_SOURCES
                    }

                search_data = resp.json()
                raw_results = []
                
                # Parse TinyFish response schema
                # Support various formats: { "results": [...] } or list directly
                if isinstance(search_data, dict):
                    raw_results = search_data.get("results", search_data.get("data", []))
                elif isinstance(search_data, list):
                    raw_results = search_data

                if not raw_results:
                    logger.info("TinyFish Search returned 0 results. Falling back to curated sources.")
                    return {
                        "is_live": True,
                        "provider": "TinyFish Search API (api.search.tinyfish.ai)",
                        "query": query,
                        "message": "Search returned no direct matches. Displaying relevant recovery reference sources.",
                        "sources": DEMO_FALLBACK_SOURCES
                    }

                parsed_sources = []
                for item in raw_results[:5]:
                    url = item.get("url", "")
                    title = item.get("title", "Untitled Technical Resource")
                    snippet = item.get("snippet", item.get("description", ""))
                    domain = item.get("domain", "")
                    if not domain and url:
                        try:
                            from urllib.parse import urlparse
                            domain = urlparse(url).netloc
                        except Exception:
                            domain = "web"

                    parsed_sources.append({
                        "title": title,
                        "url": url,
                        "domain": domain,
                        "snippet": snippet,
                        "fetched_content": None,
                        "is_live": True,
                        "provider": "TinyFish Live Search API"
                    })

                # Fetch clean markdown content for the top relevant URL if requested
                if fetch_top_url and parsed_sources and parsed_sources[0]["url"]:
                    top_url = parsed_sources[0]["url"]
                    fetched_text = await self.fetch_content(top_url, purpose)
                    parsed_sources[0]["fetched_content"] = fetched_text

                return {
                    "is_live": True,
                    "provider": "TinyFish Live Web Search & Fetch API (api.tinyfish.ai)",
                    "query": query,
                    "message": f"Successfully retrieved {len(parsed_sources)} live technical resources via TinyFish.",
                    "sources": parsed_sources
                }

        except Exception as e:
            logger.error(f"Error querying TinyFish API: {str(e)}")
            return {
                "is_live": False,
                "provider": "TINYFISH CONNECTION ERROR - Fallback Activated",
                "query": query,
                "message": f"Connection error reaching TinyFish ({str(e)}). Using reliable curated technical guidance.",
                "sources": DEMO_FALLBACK_SOURCES
            }

    async def fetch_content(self, url: str, purpose: Optional[str] = None) -> Optional[str]:
        """
        Calls TinyFish Fetch API (POST https://api.fetch.tinyfish.ai) to retrieve
        clean markdown content from the specified URL.
        """
        if not self.is_configured():
            return None

        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": "TeamPulse-RecoveryEngine/1.0"
        }
        payload = {
            "urls": [url],
            "format": "markdown",
            "purpose": purpose or "Extract technical API guidance and troubleshooting details.",
            "links": False,
            "image_links": False
        }

        try:
            logger.info(f"Calling TinyFish Fetch API for URL: {url}")
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(self.fetch_url, headers=headers, json=payload)
                if resp.status_code == 200:
                    fetch_data = resp.json()
                    # Response could be {"results": [{"content": "...", "url": "..."}]} or similar
                    if isinstance(fetch_data, dict):
                        results = fetch_data.get("results", fetch_data.get("data", []))
                        if results and isinstance(results, list):
                            return results[0].get("content") or results[0].get("markdown")
                    return str(fetch_data)[:1000]
                else:
                    logger.warning(f"TinyFish Fetch API error HTTP {resp.status_code}")
                    return None
        except Exception as e:
            logger.error(f"TinyFish Fetch failed for {url}: {e}")
            return None

tinyfish_service = TinyFishService()
