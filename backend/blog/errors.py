"""Exceptions carry no text on purpose: upstream bodies, URLs and credential
errors can hold keys or request ids, and nothing here may reach a log or a
browser."""


class BlogNotFound(Exception):
    """The post or media does not exist (or the id is not a valid id)."""


class BlogUnavailable(Exception):
    """The blog API cannot be used right now (down, rejected us, broke the contract)."""


class BlogAuthError(Exception):
    """No token could be obtained."""
