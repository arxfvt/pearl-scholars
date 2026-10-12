-- SAMPLE DATA ONLY. Every row is flagged is_sample = true. Delete before launch:
--   delete from scholarships where is_sample; delete from testimonials where is_sample;

insert into scholarships (slug, title, provider, provider_url, country, summary, description, eligibility, benefits, required_documents, amount_text, levels, fields, tags, deadline, featured, status, is_sample) values
('sample-o-level-bursary-2027', '[SAMPLE] O-Level Merit Bursary 2027', 'Sample Education Trust', 'https://example.org', 'Uganda',
 'Bursary for high-performing O-Level students.', '<p>Sample listing for layout testing.</p>', 'Ugandan citizen; top 10% of class.', 'Tuition and scholastic materials.', 'Report cards, national ID or birth certificate.', 'Full tuition', '{o_level}', '{General}', '{bursary}', now() + interval '60 days', true, 'published', true),
('sample-a-level-science-2027', '[SAMPLE] A-Level Science Scholarship 2027', 'Sample STEM Foundation', 'https://example.org', 'Uganda',
 'Support for A-Level students in sciences.', '<p>Sample listing for layout testing.</p>', 'PCM or PCB combination; strong UCE results.', 'Tuition, boarding and books.', 'UCE certificate, report cards.', 'Tuition + boarding', '{a_level}', '{Science}', '{stem}', now() + interval '20 days', true, 'published', true),
('sample-bachelors-leaders-2027', '[SAMPLE] Young Leaders Bachelors Scholarship 2027', 'Sample Leaders Programme', 'https://example.org', 'Kenya',
 'Undergraduate scholarship for emerging leaders.', '<p>Sample listing for layout testing.</p>', 'East African citizen; UACE or equivalent.', 'Full tuition, stipend, mentorship.', 'Transcripts, ID, recommendation letter.', 'USD 8,000 per year', '{bachelors}', '{Business,Education}', '{leadership}', now() + interval '90 days', true, 'published', true),
('sample-masters-research-2027', '[SAMPLE] Postgraduate Research Award 2027', 'Sample University Fund', 'https://example.org', 'United Kingdom',
 'Masters funding for research-focused students.', '<p>Sample listing for layout testing.</p>', 'First class or upper second degree.', 'Fees and living allowance.', 'Degree certificate, transcripts, research proposal.', 'Full funding', '{postgraduate}', '{Health,Science}', '{research}', now() + interval '45 days', false, 'published', true),
('sample-all-levels-closed-2026', '[SAMPLE] Community Scholars Fund (closed)', 'Sample Community Fund', 'https://example.org', 'Tanzania',
 'Closed sample to test the closed badge.', '<p>Sample listing for layout testing.</p>', 'Open to all levels.', 'Partial tuition support.', 'ID, school records.', 'Partial tuition', '{o_level,a_level,bachelors,postgraduate}', '{General}', '{community}', now() - interval '10 days', false, 'closed', true);

insert into testimonials (name, scholarship_won, school, quote, approved, sort_order, is_sample) values
('[SAMPLE] Amina N.', 'A-Level Science Scholarship', 'Sample High School', 'Sample quote: Pearl Scholars helped me find an opportunity I did not know existed.', true, 1, true),
('[SAMPLE] Brian K.', 'Young Leaders Bachelors Scholarship', 'Sample University', 'Sample quote: The registration was simple and I could track my status.', true, 2, true),
('[SAMPLE] Grace A.', 'Postgraduate Research Award', 'Sample College', 'Sample quote: I got updates by email at every step.', true, 3, true);

insert into site_content (key, value) values
('faq', '[{"q":"Is Pearl Scholars free to use?","a":"Yes. Browsing and registering for scholarships is free."},{"q":"How will I know if I am selected?","a":"We email you when your status changes, and you can check My registrations anytime."}]'),
('contact', '{"phone":"","whatsapp":"","email":"","address":"Mengo, P.O. Box 24930, Kampala, Uganda"}'),
('social', '{"facebook":"","instagram":"","tiktok":"","x":"","linkedin":"","youtube":""}')
on conflict (key) do nothing;
