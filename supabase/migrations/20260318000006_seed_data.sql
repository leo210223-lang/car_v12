-- =============================================
-- 發財B平台 - 種子資料
-- Migration: 20260318000006_seed_data.sql
-- =============================================

-- =============================================
-- 1. 品牌種子資料
-- =============================================
INSERT INTO brands (name, sort_order) VALUES
-- 日系
('Toyota', 1),
('Honda', 2),
('Nissan', 3),
('Mazda', 4),
('Mitsubishi', 5),
('Subaru', 6),
('Suzuki', 7),
('Lexus', 8),
('Infiniti', 9),
-- 德系
('BMW', 10),
('Mercedes-Benz', 11),
('Audi', 12),
('Volkswagen', 13),
('Porsche', 14),
-- 美系
('Ford', 15),
('Chevrolet', 16),
('Jeep', 17),
('Tesla', 18),
-- 韓系
('Hyundai', 19),
('Kia', 20),
('Genesis', 21),
-- 法系
('Peugeot', 22),
('Citroën', 23),
-- 英系
('Land Rover', 24),
('Jaguar', 25),
('Mini', 26),
-- 義系
('Ferrari', 27),
('Lamborghini', 28),
('Maserati', 29),
-- 其他
('Volvo', 30)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 2. 規格種子資料（以主要品牌為例）
-- =============================================

-- Toyota 規格
INSERT INTO specs (brand_id, name, sort_order)
SELECT id, 'Camry', 1 FROM brands WHERE name = 'Toyota'
UNION ALL SELECT id, 'Corolla', 2 FROM brands WHERE name = 'Toyota'
UNION ALL SELECT id, 'RAV4', 3 FROM brands WHERE name = 'Toyota'
UNION ALL SELECT id, 'Yaris', 4 FROM brands WHERE name = 'Toyota'
UNION ALL SELECT id, 'Altis', 5 FROM brands WHERE name = 'Toyota'
UNION ALL SELECT id, 'Sienna', 6 FROM brands WHERE name = 'Toyota'
UNION ALL SELECT id, 'Land Cruiser', 7 FROM brands WHERE name = 'Toyota'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Honda 規格
INSERT INTO specs (brand_id, name, sort_order)
SELECT id, 'Civic', 1 FROM brands WHERE name = 'Honda'
UNION ALL SELECT id, 'Accord', 2 FROM brands WHERE name = 'Honda'
UNION ALL SELECT id, 'CR-V', 3 FROM brands WHERE name = 'Honda'
UNION ALL SELECT id, 'HR-V', 4 FROM brands WHERE name = 'Honda'
UNION ALL SELECT id, 'Fit', 5 FROM brands WHERE name = 'Honda'
UNION ALL SELECT id, 'City', 6 FROM brands WHERE name = 'Honda'
UNION ALL SELECT id, 'Odyssey', 7 FROM brands WHERE name = 'Honda'
ON CONFLICT (brand_id, name) DO NOTHING;

-- BMW 規格
INSERT INTO specs (brand_id, name, sort_order)
SELECT id, '1 Series', 1 FROM brands WHERE name = 'BMW'
UNION ALL SELECT id, '2 Series', 2 FROM brands WHERE name = 'BMW'
UNION ALL SELECT id, '3 Series', 3 FROM brands WHERE name = 'BMW'
UNION ALL SELECT id, '4 Series', 4 FROM brands WHERE name = 'BMW'
UNION ALL SELECT id, '5 Series', 5 FROM brands WHERE name = 'BMW'
UNION ALL SELECT id, '7 Series', 6 FROM brands WHERE name = 'BMW'
UNION ALL SELECT id, 'X1', 7 FROM brands WHERE name = 'BMW'
UNION ALL SELECT id, 'X3', 8 FROM brands WHERE name = 'BMW'
UNION ALL SELECT id, 'X5', 9 FROM brands WHERE name = 'BMW'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Mercedes-Benz 規格
INSERT INTO specs (brand_id, name, sort_order)
SELECT id, 'A-Class', 1 FROM brands WHERE name = 'Mercedes-Benz'
UNION ALL SELECT id, 'C-Class', 2 FROM brands WHERE name = 'Mercedes-Benz'
UNION ALL SELECT id, 'E-Class', 3 FROM brands WHERE name = 'Mercedes-Benz'
UNION ALL SELECT id, 'S-Class', 4 FROM brands WHERE name = 'Mercedes-Benz'
UNION ALL SELECT id, 'GLA', 5 FROM brands WHERE name = 'Mercedes-Benz'
UNION ALL SELECT id, 'GLC', 6 FROM brands WHERE name = 'Mercedes-Benz'
UNION ALL SELECT id, 'GLE', 7 FROM brands WHERE name = 'Mercedes-Benz'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Lexus 規格
INSERT INTO specs (brand_id, name, sort_order)
SELECT id, 'ES', 1 FROM brands WHERE name = 'Lexus'
UNION ALL SELECT id, 'IS', 2 FROM brands WHERE name = 'Lexus'
UNION ALL SELECT id, 'NX', 3 FROM brands WHERE name = 'Lexus'
UNION ALL SELECT id, 'RX', 4 FROM brands WHERE name = 'Lexus'
UNION ALL SELECT id, 'UX', 5 FROM brands WHERE name = 'Lexus'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Tesla 規格
INSERT INTO specs (brand_id, name, sort_order)
SELECT id, 'Model 3', 1 FROM brands WHERE name = 'Tesla'
UNION ALL SELECT id, 'Model Y', 2 FROM brands WHERE name = 'Tesla'
UNION ALL SELECT id, 'Model S', 3 FROM brands WHERE name = 'Tesla'
UNION ALL SELECT id, 'Model X', 4 FROM brands WHERE name = 'Tesla'
ON CONFLICT (brand_id, name) DO NOTHING;

-- =============================================
-- 3. 車型種子資料（以主要規格為例）
-- =============================================

-- Toyota Camry 車型
INSERT INTO models (spec_id, name, sort_order)
SELECT s.id, '2.0L', 1 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Toyota' AND s.name = 'Camry'
UNION ALL SELECT s.id, '2.5L', 2 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Toyota' AND s.name = 'Camry'
UNION ALL SELECT s.id, '2.5L Hybrid', 3 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Toyota' AND s.name = 'Camry'
ON CONFLICT (spec_id, name) DO NOTHING;

-- Toyota RAV4 車型
INSERT INTO models (spec_id, name, sort_order)
SELECT s.id, '2.0L', 1 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Toyota' AND s.name = 'RAV4'
UNION ALL SELECT s.id, '2.5L', 2 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Toyota' AND s.name = 'RAV4'
UNION ALL SELECT s.id, '2.5L Hybrid', 3 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Toyota' AND s.name = 'RAV4'
UNION ALL SELECT s.id, 'Prime', 4 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Toyota' AND s.name = 'RAV4'
ON CONFLICT (spec_id, name) DO NOTHING;

-- Honda CR-V 車型
INSERT INTO models (spec_id, name, sort_order)
SELECT s.id, '1.5L Turbo', 1 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Honda' AND s.name = 'CR-V'
UNION ALL SELECT s.id, '2.0L Hybrid', 2 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Honda' AND s.name = 'CR-V'
ON CONFLICT (spec_id, name) DO NOTHING;

-- BMW 3 Series 車型
INSERT INTO models (spec_id, name, sort_order)
SELECT s.id, '318i', 1 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'BMW' AND s.name = '3 Series'
UNION ALL SELECT s.id, '320i', 2 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'BMW' AND s.name = '3 Series'
UNION ALL SELECT s.id, '330i', 3 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'BMW' AND s.name = '3 Series'
UNION ALL SELECT s.id, 'M340i', 4 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'BMW' AND s.name = '3 Series'
ON CONFLICT (spec_id, name) DO NOTHING;

-- Mercedes-Benz C-Class 車型
INSERT INTO models (spec_id, name, sort_order)
SELECT s.id, 'C180', 1 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Mercedes-Benz' AND s.name = 'C-Class'
UNION ALL SELECT s.id, 'C200', 2 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Mercedes-Benz' AND s.name = 'C-Class'
UNION ALL SELECT s.id, 'C300', 3 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Mercedes-Benz' AND s.name = 'C-Class'
UNION ALL SELECT s.id, 'C43 AMG', 4 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Mercedes-Benz' AND s.name = 'C-Class'
ON CONFLICT (spec_id, name) DO NOTHING;

-- Tesla Model 3 車型
INSERT INTO models (spec_id, name, sort_order)
SELECT s.id, 'Standard Range', 1 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Tesla' AND s.name = 'Model 3'
UNION ALL SELECT s.id, 'Long Range', 2 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Tesla' AND s.name = 'Model 3'
UNION ALL SELECT s.id, 'Performance', 3 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Tesla' AND s.name = 'Model 3'
ON CONFLICT (spec_id, name) DO NOTHING;

-- Tesla Model Y 車型
INSERT INTO models (spec_id, name, sort_order)
SELECT s.id, 'Standard Range', 1 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Tesla' AND s.name = 'Model Y'
UNION ALL SELECT s.id, 'Long Range', 2 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Tesla' AND s.name = 'Model Y'
UNION ALL SELECT s.id, 'Performance', 3 FROM specs s JOIN brands b ON s.brand_id = b.id WHERE b.name = 'Tesla' AND s.name = 'Model Y'
ON CONFLICT (spec_id, name) DO NOTHING;
