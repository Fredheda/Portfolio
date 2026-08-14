-- One-time: grant the deployed container app's managed identity write
-- access to chatbot_logs. Run once against Azure SQL (e.g. via the Azure
-- Portal Query Editor, signed in as the Entra ID admin) after
-- infra/deploy.sh has created the identity. Not part of deploy.sh, since
-- re-running CREATE USER on an existing user errors.
--
-- Only db_datawriter: the backend only ever INSERTs log rows, so it doesn't
-- need read or schema-modification rights.
--
-- [id-portfolio-acrpull] is the identityName Bicep param's default
-- (infra/main.bicep) -- update this if you ever rename it.
CREATE USER [id-portfolio-acrpull] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datawriter ADD MEMBER [id-portfolio-acrpull];
