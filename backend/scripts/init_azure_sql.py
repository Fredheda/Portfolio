import os
import mssql_python
from dotenv import load_dotenv

load_dotenv()

_client_id = os.getenv("AZURE_CLIENT_ID")
_auth = f"Authentication=ActiveDirectoryMSI;User Id={_client_id};" if _client_id else "Authentication=ActiveDirectoryDefault;"

conn = mssql_python.connect(
    f"Server={os.environ['AZURE_SQL_SERVER']};"
    f"Database={os.environ['AZURE_SQL_DATABASE']};"
    f"{_auth}"
    "Encrypt=yes;"
)
cursor = conn.cursor()
cursor.execute("""
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chatbot_logs')
BEGIN
    CREATE TABLE chatbot_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        timestamp DATETIME2 NOT NULL,
        message_type NVARCHAR(50) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        duration INT NOT NULL
    );
END
""")
conn.commit()
cursor.close()
conn.close()
print("chatbot_logs table ready.")
