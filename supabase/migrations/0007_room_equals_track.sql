-- The three tracks are the three rooms; there were never separate room numbers.
-- Normalise every stored room to its track's label so nothing displays a stale
-- "Auditorium" or "Room 2", and so a clash check on room means the same thing
-- as a clash check on track.
update public.sessions set room = 'Main stage'     where track = 'main';
update public.sessions set room = 'Demos'          where track = 'demos';
update public.sessions set room = 'Open sessions'  where track = 'open';
