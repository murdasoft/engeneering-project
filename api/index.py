"""
Vercel Python serverless entry point for the Telegram bot.
Wraps the FastAPI application from main.py with Mangum.
"""

from mangum import Mangum
from main import app

handler = Mangum(app)
