-- 0006 created client_code_seq for the auto-assigned client_code default, but
-- creating a sequence doesn't grant other roles nextval()/currval() on it the
-- way table grants cover INSERT — client creation was failing with
-- "permission denied for sequence client_code_seq".
grant usage, select on sequence client_code_seq to authenticated, service_role;
