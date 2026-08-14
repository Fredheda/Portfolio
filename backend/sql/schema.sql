-- chatbot_logs: one row per interaction step (user input, tool search
-- query, final response) logged fire-and-forget by services/database_client.py.
-- Run via backend/scripts/init_azure_sql.py; idempotent (IF NOT EXISTS).
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
