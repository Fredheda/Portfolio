import mssql_python
import os
import threading
from dotenv import load_dotenv
from datetime import datetime
_ = load_dotenv()

class database_client:
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
            auth = f"Authentication=ActiveDirectoryMSI;User Id={self.managed_identity_client_id};"
        else:
            auth = "Authentication=ActiveDirectoryDefault;"
        return (
            f"Server={self.server};"
            f"Database={self.database};"
            f"{auth}"
            "Encrypt=yes;"
        )

    def _write_log(self, message: str, message_type: str, duration: int):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        conn = None
        cursor = None
        try:
            conn = mssql_python.connect(self._connection_string())
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO chatbot_logs (timestamp, message_type, message, duration) VALUES (?, ?, ?, ?)",
                (timestamp, message_type, message, duration)
            )
            conn.commit()
        except Exception as e:
            print(f"Error logging chatbot interaction: {e}")
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
