-- Add a clinical/basic abstract submission classifier
ALTER TABLE abstractions
ADD COLUMN abstract_submission_type TEXT;
