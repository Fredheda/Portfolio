import pytest
from services import database_client as module

PAUSED = Exception("('42000', '[42000] Database is not currently available. (40613)')")


class FakeCursor:
    def __init__(self, conn):
        self.conn = conn

    def execute(self, sql, params):
        self.conn.rows.append(params)

    def close(self):
        pass


class FakeConnection:
    def __init__(self, rows):
        self.rows = rows

    def cursor(self):
        return FakeCursor(self)

    def commit(self):
        pass

    def close(self):
        pass


class FakeDriver:
    """Stands in for mssql_python.connect: raises each queued error, then connects."""

    def __init__(self, errors):
        self.errors = list(errors)
        self.attempts = 0
        self.rows = []

    def connect(self, _connection_string):
        self.attempts += 1
        if self.errors:
            raise self.errors.pop(0)
        return FakeConnection(self.rows)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(module.database_client, "retry_delay_seconds", 0)
    return module.database_client()


def use_driver(monkeypatch, errors):
    driver = FakeDriver(errors)
    monkeypatch.setattr(module.mssql_python, "connect", driver.connect)
    return driver


def test_a_paused_database_is_retried_once_and_the_row_is_written(client, monkeypatch):
    driver = use_driver(monkeypatch, [PAUSED])
    client._write_log("hello", "user", 5)
    assert driver.attempts == 2
    assert len(driver.rows) == 1
    assert driver.rows[0][1:] == ("user", "hello", 5)


def test_a_database_still_paused_after_the_retry_drops_the_row_quietly(
    client, monkeypatch
):
    driver = use_driver(monkeypatch, [PAUSED, PAUSED])
    client._write_log("hello", "user", 5)
    assert driver.attempts == 2
    assert driver.rows == []


def test_other_errors_are_not_retried(client, monkeypatch):
    driver = use_driver(monkeypatch, [Exception("login failed (18456)")])
    client._write_log("hello", "user", 5)
    assert driver.attempts == 1
    assert driver.rows == []


def test_a_healthy_database_is_written_once(client, monkeypatch):
    driver = use_driver(monkeypatch, [])
    client._write_log("hello", "user", 5)
    assert driver.attempts == 1
    assert len(driver.rows) == 1
