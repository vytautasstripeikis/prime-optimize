
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can subscribe to their own topic" ON realtime.messages;

CREATE POLICY "users can subscribe to their own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('sync:' || auth.uid()::text)
);
