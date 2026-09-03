-- Correct early-bird pricing for registrations charged standard rates on Sep 1, 2026
-- (UTC deadline bug). Run after issuing partial Stripe refunds manually.
--
-- Cloudflare D1 console, or:
--   npx wrangler d1 execute isir-registrations --remote --file=./db/fix_early_bird_sep1_overcharges.sql
--
-- Affected: 15 rows, $1,400 total overcharge

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 250,
    total_price = 250,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788225015067-UBF16NKQN'; -- herb1006@yuhs.ac (trainee-non-member)

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788226614140-R1N3ATPG8'; -- xoalsvos9607@naver.com

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 650,
    total_price = 650,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788234393990-NOCQ0R015'; -- kerrie.foyle@adelaide.edu.au (non-member)

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788245681372-TOZ3EPK1C'; -- sgoto@med.nagoya-cu.ac.jp

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788247370341-2VODX7S4T'; -- ihlee86@yuhs.ac

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788247469076-GTRXI5THE'; -- madamana3@gmail.com

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 150,
    total_price = 150,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788260225749-9AE50DX0O'; -- dzsand@gmail.com

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 150,
    total_price = 150,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788261198813-5SKFB37D5'; -- mbgadingan@up.edu.ph

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788265285348-95H4BEQEC'; -- vmfajardo.md@gmail.com

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788266076741-SR9R4J47B'; -- gracegarciamd@gmail.com

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788270625614-UALH0VMK4'; -- jkjoo@pusan.ac.kr

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 600,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788271296495-6ZUO23BGJ'; -- wangmei1990@whu.edu.cn (+1 accompanying)

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 150,
    total_price = 150,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788273405819-FMF3KJKO8'; -- emma.giesen@googlemail.com

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788273514723-43N8IRDX5'; -- psyche622@naver.com

UPDATE registrations
SET
    is_early_bird = 1,
    ticket_price = 350,
    total_price = 350,
    updated_at = CAST(strftime('%s', 'now') AS INTEGER) * 1000
WHERE id = 'REG-1788317801409-2GY74W2O5'; -- dinorahsalazargarcia@gmail.com

-- Verify (expect 15 rows, all is_early_bird = 1)
SELECT
    id,
    email,
    ticket_type,
    ticket_price,
    total_price,
    accompanying_count,
    is_early_bird,
    payment_intent_id
FROM registrations
WHERE id IN (
    'REG-1788225015067-UBF16NKQN',
    'REG-1788226614140-R1N3ATPG8',
    'REG-1788234393990-NOCQ0R015',
    'REG-1788245681372-TOZ3EPK1C',
    'REG-1788247370341-2VODX7S4T',
    'REG-1788247469076-GTRXI5THE',
    'REG-1788260225749-9AE50DX0O',
    'REG-1788261198813-5SKFB37D5',
    'REG-1788265285348-95H4BEQEC',
    'REG-1788266076741-SR9R4J47B',
    'REG-1788270625614-UALH0VMK4',
    'REG-1788271296495-6ZUO23BGJ',
    'REG-1788273405819-FMF3KJKO8',
    'REG-1788273514723-43N8IRDX5',
    'REG-1788317801409-2GY74W2O5'
)
ORDER BY registration_date;
