-- Migration: Phase 1 Age-Only Migration - Add Canonical Student Age (الصف / المرحلة الدراسية)
-- Adds age (text), grade_level (text), stage (text), and grade (integer) columns and high-performance grouping/filtering indexes.
-- Historical class columns (class_id, class_name) and classes table are deliberately preserved for backward compatibility.

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "age" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "grade_level" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "stage" text;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "grade" integer;

CREATE INDEX IF NOT EXISTS "idx_students_school_age" ON "students" ("school_id", "age");
CREATE INDEX IF NOT EXISTS "idx_students_age" ON "students" ("age");
CREATE INDEX IF NOT EXISTS "idx_students_school_grade_level" ON "students" ("school_id", "grade_level");
CREATE INDEX IF NOT EXISTS "idx_students_grade_level" ON "students" ("grade_level");
