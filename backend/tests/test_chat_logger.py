import pytest
from agent.logging_middleware import LoggingMiddleware
from services.chat_logger import NoopChatLogger, chat_logger_from_env
from services.database_client import database_client

NAMES = {"AZURE_SQL_SERVER": "server.example", "AZURE_SQL_DATABASE": "db"}


def test_a_local_start_with_the_sql_names_in_env_logs_nothing_and_says_so_once(capsys):
    logger = chat_logger_from_env(NAMES)
    assert isinstance(logger, NoopChatLogger)
    assert capsys.readouterr().out.count("Chat logging to Azure SQL is off") == 1


def test_the_noop_logger_accepts_calls_and_starts_no_thread():
    logger = chat_logger_from_env({})
    assert logger.log_chatbot_interaction("hi", "user_input", 0) is None


@pytest.mark.parametrize(
    "extra", [{"CONTAINER_APP_NAME": "ca-portfolio-backend"}, {"CHAT_LOG_TO_SQL": "1"}]
)
def test_running_in_azure_or_opting_in_uses_the_sql_logger(extra, capsys):
    logger = chat_logger_from_env({**NAMES, **extra})
    assert isinstance(logger, database_client)
    assert "Chat logging to Azure SQL is on." in capsys.readouterr().out


@pytest.mark.parametrize("value", ["", "0", "true", "yes"])
def test_only_the_exact_opt_in_value_counts(value):
    assert isinstance(
        chat_logger_from_env({**NAMES, "CHAT_LOG_TO_SQL": value}), NoopChatLogger
    )


@pytest.mark.parametrize(
    "env",
    [
        {"CONTAINER_APP_NAME": "ca-portfolio-backend"},
        {"CHAT_LOG_TO_SQL": "1", "AZURE_SQL_SERVER": "server.example"},
    ],
)
def test_sql_logging_without_both_names_stays_off_and_says_so(env, capsys):
    assert isinstance(chat_logger_from_env(env), NoopChatLogger)
    assert "AZURE_SQL_SERVER or AZURE_SQL_DATABASE is not set" in capsys.readouterr().out


def test_the_middleware_default_follows_the_environment(monkeypatch):
    for name, value in NAMES.items():
        monkeypatch.setenv(name, value)
    monkeypatch.delenv("CONTAINER_APP_NAME", raising=False)
    monkeypatch.delenv("CHAT_LOG_TO_SQL", raising=False)
    assert isinstance(LoggingMiddleware()._db, NoopChatLogger)
    monkeypatch.setenv("CONTAINER_APP_NAME", "ca-portfolio-backend")
    assert isinstance(LoggingMiddleware()._db, database_client)
