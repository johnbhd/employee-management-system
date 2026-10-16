-- Store prototype attendance settings per canonical employee.
CREATE TABLE "employee_attendance_demo_settings" (
  "id" UUID NOT NULL,
  "employee_id" UUID NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "custom_time" VARCHAR(5),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "employee_attendance_demo_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_attendance_demo_settings_employee_id_key"
  ON "employee_attendance_demo_settings"("employee_id");

ALTER TABLE "employee_attendance_demo_settings"
  ADD CONSTRAINT "employee_attendance_demo_settings_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
