import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime
_ = load_dotenv()

class database_client:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL")

    def log_chatbot_interaction(self, message: str, message_type: str, duration: int):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        try:
            conn = psycopg2.connect(self.database_url, sslmode='require')
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO chatbot_logs (timestamp, message_type, message, duration) VALUES (%s, %s, %s, %s)",
                (timestamp, message_type, message, duration)
            )
            conn.commit()
        except Exception as e:
            print(f"Error logging chatbot interaction: {e}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()