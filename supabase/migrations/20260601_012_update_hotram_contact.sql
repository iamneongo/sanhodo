update public.branches
set
  phone = '0522282229',
  landing_config = coalesce(landing_config, '{}'::jsonb) || jsonb_build_object(
    'mapUrl',
    'https://maps.app.goo.gl/DBABeiaozYrPY2Dv5?g_st=iz'
  )
where
  code = 'main'
  or lower(coalesce(name, '')) like '%hồ tràm%'
  or lower(coalesce(name, '')) like '%ho tram%'
  or lower(coalesce(address, '')) like '%xuyên mộc%'
  or lower(coalesce(address, '')) like '%xuyen moc%';
