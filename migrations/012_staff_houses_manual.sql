-- Manual staff house assignments (unmatched from CSV import)
-- veronica a → Kiburi (corrected)
update profiles set house_id = (select id from houses where name = 'Kiburi')
where email = 'vacosta@soarcharteracademy.org';

-- maddie → Superbia
update profiles set house_id = (select id from houses where name = 'Superbia')
where email = 'msachs@soarcharteracademy.org';

-- gelly → Superbia
update profiles set house_id = (select id from houses where name = 'Superbia')
where email = 'gthompson@soarcharteracademy.org';

-- terri → Fierte
update profiles set house_id = (select id from houses where name = 'Fierte')
where email = 'tknipper@soarcharteracademy.org';

-- roni → Hokori
update profiles set house_id = (select id from houses where name = 'Hokori')
where email = 'vwilson@soarcharteracademy.org';

-- regina → Orgullo
update profiles set house_id = (select id from houses where name = 'Orgullo')
where email = 'rjaramillo@soarcharteracademy.org';

-- tj → Kiburi
update profiles set house_id = (select id from houses where name = 'Kiburi')
where email = 'tgonzales@soarcharteracademy.org';

-- janae → Hokori
update profiles set house_id = (select id from houses where name = 'Hokori')
where email = 'jwestmoreland@soarcharteracademy.org';

-- felicia → Orgullo
update profiles set house_id = (select id from houses where name = 'Orgullo')
where email = 'fquevedo@soarcharteracademy.org';

-- tony → Hokori
update profiles set house_id = (select id from houses where name = 'Hokori')
where email = 'tperez@soarcharteracademy.org';

-- kailyn → Fierte
update profiles set house_id = (select id from houses where name = 'Fierte')
where email = 'kruano@soarcharteracademy.org';

-- emma n → Orgullo (fix: was matched to Hokori by script)
update profiles set house_id = (select id from houses where name = 'Orgullo')
where email = 'enowlin@soarcharteracademy.org';

-- diana → Fierte
update profiles set house_id = (select id from houses where name = 'Fierte')
where email = 'dwallace@soarcharteracademy.org';

-- davon → Kiburi
update profiles set house_id = (select id from houses where name = 'Kiburi')
where email = 'dhardy@soarcharteracademy.org';

-- tyler → Orgullo
update profiles set house_id = (select id from houses where name = 'Orgullo')
where email = 'tgeorge@soarcharteracademy.org';

-- veronica p → Superbia
update profiles set house_id = (select id from houses where name = 'Superbia')
where email = 'vperez@soarcharteracademy.org';

-- jeff → Fierte
update profiles set house_id = (select id from houses where name = 'Fierte')
where email = 'jmccune@soarcharteracademy.org';

-- kelly → Hokori
update profiles set house_id = (select id from houses where name = 'Hokori')
where email = 'ktarrango@soarcharteracademy.org';

-- tania → Fierte
update profiles set house_id = (select id from houses where name = 'Fierte')
where email = 'tzuniga@soarcharteracademy.org';

-- vanessa → Fierte
update profiles set house_id = (select id from houses where name = 'Fierte')
where email = 'valvarran@soarcharteracademy.org';

-- Aaron fix → Superbia
update profiles set house_id = (select id from houses where name = 'Superbia')
where email = 'achochrek@soarcharteracademy.org';