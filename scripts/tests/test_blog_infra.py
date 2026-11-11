"""Text checks on the blog read identity. Bicep has no other test, and a role
assignment added to this identity by mistake would give the site Azure rights it
must not have: the only grant it needs is an app role in the blog project,
made by that project's approve-client script, never here."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BICEP = (ROOT / "infra" / "main.bicep").read_text()
DEPLOY = (ROOT / "infra" / "deploy.sh").read_text()


def test_the_blog_identity_exists_and_no_azure_role_names_it() -> None:
    assert "param blogReadIdentityName string = 'id-portfolio-blogread'" in BICEP
    assert "resource blogReadIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities" in BICEP
    roles = re.findall(
        r"resource \w+ 'Microsoft\.Authorization/roleAssignments[^\n]*\{.*?\n\}",
        BICEP,
        re.S,
    )
    assert roles, "the AcrPull assignment should still be there"
    assert all("blogReadIdentity" not in block for block in roles)


def test_sql_and_the_registry_keep_the_original_identity() -> None:
    assert "{ name: 'AZURE_CLIENT_ID', value: identity.properties.clientId }" in BICEP


def test_the_backend_has_both_identities() -> None:
    backend = BICEP.split("resource backend ", 1)[1].split("resource frontend ", 1)[0]
    assert "'${identity.id}': {}" in backend
    assert "'${blogReadIdentity.id}': {}" in backend


def test_blog_settings_reach_the_backend_only_when_a_url_is_given() -> None:
    assert "empty(blogApiUrl) ? []" in BICEP
    assert "{ name: 'BLOG_READ_CLIENT_ID', value: blogReadIdentity.properties.clientId }" in BICEP
    assert "{ name: 'BLOG_API_URL', value: blogApiUrl }" in BICEP
    assert "{ name: 'BLOG_API_AUDIENCE', value: blogApiAudience }" in BICEP


def test_the_deploy_script_passes_the_blog_settings_through() -> None:
    assert 'blogApiUrl="${BLOG_API_URL:-}"' in DEPLOY
    assert 'blogApiAudience="${BLOG_API_AUDIENCE:-}"' in DEPLOY
