-- Sana mesaj atan kişiye, sen onu takip etmesen de cevap verebilirsin.

drop policy if exists "Kullanıcı takip ettiği kişiye mesaj gönderebilir" on public.direct_messages;

create policy "Kullanıcı sohbet ortağına mesaj gönderebilir"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id
    and (
      exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.following_id = receiver_id
      )
      or exists (
        select 1 from public.direct_messages m
        where m.sender_id = receiver_id and m.receiver_id = auth.uid()
      )
    )
  );
