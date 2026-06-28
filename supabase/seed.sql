-- Seed data. case_types and practice areas stay empty until the firm confirms
-- their taxonomy (blocked on onboarding doc). Document categories ship with the
-- six universal defaults.

insert into document_categories (name, slug) values
  ('Pleadings',      'pleadings'),
  ('Affidavits',     'affidavits'),
  ('Correspondence', 'correspondence'),
  ('KYC',            'kyc'),
  ('Evidence',       'evidence'),
  ('Invoices',       'invoices')
on conflict (slug) do nothing;

-- Singleton firm settings row.
insert into firm_settings (id) values (true)
on conflict (id) do nothing;
