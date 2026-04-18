ALTER TABLE public.vehicles
ADD COLUMN mileage integer NULL,
ADD COLUMN color character varying(50) NULL,
ADD COLUMN transmission character varying(50) NULL,
ADD COLUMN fuel_type character varying(50) NULL;
