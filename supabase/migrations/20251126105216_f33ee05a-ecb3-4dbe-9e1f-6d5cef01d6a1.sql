-- Add male options to gender_identity enum
ALTER TYPE gender_identity ADD VALUE IF NOT EXISTS 'man_cis';
ALTER TYPE gender_identity ADD VALUE IF NOT EXISTS 'man_trans';