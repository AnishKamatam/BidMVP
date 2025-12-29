--Restrict email to only .edu addresses

CREATE OR REPLACE FUNCTION check_edu_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.email NOT LIKE '%.edu' THEN
    RAISE EXCEPTION 'Only .edu email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--Validate edu email on sign up
CREATE OR REPLACE TRIGGER validate_edu_email_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION check_edu_email();