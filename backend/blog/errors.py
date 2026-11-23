"""No text on purpose: upstream bodies, URLs and credential errors can hold keys or request ids."""


class BlogNotFound(Exception):
    pass


class BlogUnavailable(Exception):
    pass


class BlogAuthError(Exception):
    pass
