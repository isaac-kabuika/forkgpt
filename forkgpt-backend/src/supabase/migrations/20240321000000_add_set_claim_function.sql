-- Function to set auth.uid() for service role operations
create or replace function set_claim(uid text)
returns void as $$
begin
  set local role authenticated;
  set local request.jwt.claim.sub = uid;
end;
$$ language plpgsql security definer; 