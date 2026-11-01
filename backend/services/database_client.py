import os
import threading
import time
from datetime import datetime

import mssql_python
from dotenv import load_dotenv

_ = load_dotenv()

# Azure SQL error: database not currently available (serverless auto-pause).
PAUSED_ERROR = "40613"


class database_client:
    # Resume takes several seconds; the write runs on a background thread.
    retry_delay_seconds = 10

    def __init__(self):
        self.server = os.getenv("AZURE_SQL_SERVER")
        self.database = os.getenv("AZURE_SQL_DATABASE")
        # Set only when deployed (Bicep sets this to the container's managed
        # identity client ID) -- its presence picks ActiveDirectoryMSI auth
        # over ActiveDirectoryDefault (az login), which only works locally.
        self.managed_identity_client_id = os.getenv("AZURE_CLIENT_ID")

    def log_chatbot_interaction(self, message: str, message_type: str, duration: int):
        # Fire-and-forget: the free-tier Azure SQL Database auto-pauses after
        # idle time and can take several seconds to resume. Logging must
        # never add that latency to a visitor's chatbot response.
        threading.Thread(
            target=self._write_log,
            args=(message, message_type, duration),
            daemon=True,
        ).start()

    def _connection_string(self) -> str:
        if self.managed_identity_client_id:
            auth = f"Authentication=ActiveDirectoryMSI;Uid={self.managed_identity_client_id};"
        else:
            auth = "Authentication=ActiveDirectoryDefault;"
        return f"Server={self.server};Database={self.database};{auth}Encrypt=yes;"

    def _write_log(self, message: str, message_type: str, duration: int):
        # The free-tier database auto-pauses; the first connection after an
        # idle gap fails with 40613 while it resumes. Retry once, then drop
        # the row quietly like any other logging error.
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            self._insert(timestamp, message, message_type, duration)
        except Exception as e:
            if PAUSED_ERROR not in str(e):
                print(f"Error logging chatbot interaction: {e}")
                return
            time.sleep(self.retry_delay_seconds)
            try:
                self._insert(timestamp, message, message_type, duration)
            except Exception as retry_error:
                print(f"Error logging chatbot interaction: {retry_error}")

    def _insert(self, timestamp: str, message: str, message_type: str, duration: int):
        conn = None
        cursor = None
        try:
            conn = mssql_python.connect(self._connection_string())
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO chatbot_logs (timestamp, message_type, message, duration) VALUES (?, ?, ?, ?)",
                (timestamp, message_type, message, duration),
            )
            conn.commit()
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
