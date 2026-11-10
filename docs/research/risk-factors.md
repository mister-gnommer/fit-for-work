# Risk-factor categories on the referral form

## Source and verification
Categories verified against Annex 3a (Dz.U. 2023 poz. 607, PDF p. 28; unchanged by Dz.U. 2026 poz. 456 and 726; checked 2026-11-10). The same five-part split appears in Annex 1 (wskazówki metodyczne, PDF pp. 9-24: I Czynniki fizyczne, II Pył przemysłowy, III Czynniki chemiczne, IV Czynniki biologiczne, V Inne czynniki). See `referral-form.md`, `source/dz2023-607-tj.pdf`.

## Form-wide facts
- The form does **not** contain predefined items or checkboxes. Each category is an empty free-text block. Instruction: "należy wpisać nazwę czynnika/czynników i wielkość/wielkości narażenia" (enter factor name and exposure magnitude), plus "aktualne wyniki badań i pomiarów" from that position.
- So per factor the employer supplies: name + exposure value (e.g. NDN/NDS-based measured level, per Kodeks pracy art. 227/228 regulations) as text. The item lists below are **suggestions** for a UI picker; names are taken from Annex 1 (the official factor table, which also drives exam scope and periodicity) unless marked "(practice)".
- The form's footer asks for a total count of all factors listed.
- Official form heading wording: "Pyły" (II) and "Inne czynniki, w tym niebezpieczne" (V); Annex 1 names them "Pył przemysłowy" and "Inne czynniki".

## I. Czynniki fizyczne (physical factors)
Note: measurable; form expects name + measured value/exposure level and unit (e.g. LEX,8h in dB for noise). Annex 1 also lists ultrasonic noise, optical radiation and pressure changes.
1. Hałas (noise) - e.g. LEX,8h; mandatory audiometry at >= 80 dB per Annex 1
2. Drgania miejscowe, kończyny górne (hand-arm vibration)
3. Drgania ogólne (whole-body vibration)
4. Promieniowanie jonizujące (ionising radiation) - worker category A/B
5. Pola elektromagnetyczne (electromagnetic fields)
6. Mikroklimat gorący (hot microclimate)
7. Mikroklimat zimny (cold microclimate)

## II. Pyły (dusts)
Note: Annex 1 section "Pył przemysłowy"; form expects dust type and concentration (e.g. respirable fraction, mg/m3). Crystalline-silica exposure thresholds affect X-ray scope.
1. Pyły zawierające krzemionkę krystaliczną (silica-containing dust)
2. Pyły węgla (coal dust)
3. Pyły nieorganiczne zawierające włókna azbestu (asbestos fibre dust)
4. Pył drewna (wood dust)
5. Pył mąki (flour dust)
6. Pył zawierający metale twarde, np. wolfram, kobalt (hard-metal dust)

## III. Czynniki chemiczne (chemical agents)
Note: substance name plus concentration versus NDS/NDSCh/NDSP; carcinogenic/mutagenic agents follow the list under Kodeks pracy art. 222 § 3. Annex 1 has ~30+ substance groups; list below is a small subset. Lead limits changed in 2026 (Dz.U. 2026 poz. 726).
1. Benzen i homologi: toluen, ksylen (benzene and homologues)
2. Formaldehyd (formaldehyde)
3. Amoniak (ammonia)
4. Izocyjanianowe związki (isocyanates)
5. Ołów i jego związki (lead and compounds)
6. Arsen i jego związki (arsenic and compounds)
7. Azotu tlenki (nitrogen oxides)

## IV. Czynniki biologiczne (biological agents)
Note: mostly qualitative; name the agent (and hazard group 2-4 per the list under Kodeks pracy art. 222^1 § 3); exposure value is usually not a number. Annex 1 groups other agents as "Inne czynniki zaliczone do grupy 2, 3 lub 4 zagrożenia".
1. Wirus zapalenia wątroby typu B, HBV (hepatitis B virus)
2. Wirus zapalenia wątroby typu C, HCV (hepatitis C virus)
3. Ludzki wirus niedoboru odporności, HIV
4. Prątek gruźlicy (Mycobacterium tuberculosis)
5. Wirus kleszczowego zapalenia mózgu, KZM (tick-borne encephalitis virus)
6. Borrelia burgdorferi (Lyme disease bacterium)
7. Promieniowce termofilne, grzyby pleśniowe o działaniu uczulającym (thermophilic actinomycetes, allergenic moulds)

## V. Inne czynniki, w tym niebezpieczne (other factors, incl. hazardous)
Note: catch-all for burdensome/hazardous factors and job demands, largely non-measurable; free text, state the nature and scale (e.g. height in m, hours of screen work, night shifts). Annex 1 covers these with fitness-oriented exam scopes, not exposure limits.
1. Praca na wysokości (work at height)
2. Praca na stanowiskach związanych z kierowaniem pojazdami (driving; Annex 1 title "...kierowaniem pojazdami, szkoleniem i egzaminowaniem kierowców")
3. Obsługa monitorów ekranowych (display-screen work)
4. Praca zmianowa, w tym praca w porze nocnej (shift work incl. night work)
5. Praca w wymuszonej pozycji (forced posture)
6. Praca związana z obsługą narzędzi, maszyn, urządzeń i pojazdów poruszających się poza drogami publicznymi, np. wózki widłowe (operating moving machinery/forklifts off public roads)
7. Niekorzystne czynniki psychospołeczne (adverse psychosocial factors: information load, responsibility, life-threatening work, monotony, time pressure)

Unverified: the exact wording of "praca na wysokości" in Annex 1 comes from garbled PDF text extraction (item name legible; the label "(praca na wysokości)" is as listed above). Item selection is a suggestion, not a closed official list.
