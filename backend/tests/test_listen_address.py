from main import listen_address


def test_the_default_is_loopback_on_port_8000():
    assert listen_address({}) == ("127.0.0.1", 8000)


def test_host_and_port_come_from_the_environment():
    assert listen_address({"HOST": "0.0.0.0", "PORT": "9000"}) == ("0.0.0.0", 9000)


def test_an_empty_host_falls_back_to_loopback():
    assert listen_address({"HOST": ""}) == ("127.0.0.1", 8000)
