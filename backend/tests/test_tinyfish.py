import asyncio
from app.tinyfish_service import tinyfish_service, DEMO_FALLBACK_SOURCES

def test_tinyfish_service_graceful_fallback_without_key():
    async def _test():
        # When no key is set or empty
        tinyfish_service.api_key = None
        result = await tinyfish_service.search("REST API integration troubleshooting")
        
        assert result["is_live"] is False
        assert "DEMO MODE" in result["provider"]
        assert len(result["sources"]) > 0
        # Genuine fallback resources exist
        assert any("fastapi" in s["url"] for s in result["sources"])
    asyncio.run(_test())

def test_tinyfish_service_honest_labeling():
    async def _test():
        # Ensure source has provider and clear metadata
        result = await tinyfish_service.search("Test query")
        for s in result["sources"]:
            assert "url" in s
            assert "title" in s
            assert "snippet" in s
            assert "is_live" in s
    asyncio.run(_test())
