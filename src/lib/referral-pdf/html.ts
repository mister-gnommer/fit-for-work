import type { ReferralSnapshot, RiskCategory } from "./snapshot";

const CATEGORIES: { category: RiskCategory; no: string; title: string }[] = [
  { category: "PHYSICAL", no: "I.", title: "Czynniki fizyczne:" },
  { category: "DUSTS", no: "II.", title: "Pyły:" },
  { category: "CHEMICAL", no: "III.", title: "Czynniki chemiczne:" },
  { category: "BIOLOGICAL", no: "IV.", title: "Czynniki biologiczne:" },
  { category: "OTHER", no: "V.", title: "Inne czynniki, w tym niebezpieczne:" },
];

const EXAM_TYPES = ["PRE_EMPLOYMENT", "PERIODIC", "FOLLOW_UP"] as const;

/** Escapes text for use in HTML element content and attribute values. */
function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Wraps markup in a strike-through span; empty input stays empty. */
function strike(html: string): string {
  return html ? `<span class="strike">${html}</span>` : "";
}

/**
 * Renders "a/b/c" options as on the paper form, striking every option except the chosen one.
 * @param options option words, already safe HTML
 * @param chosen index of the option to keep, or -1 to strike all of them
 */
function pick(options: readonly string[], chosen: number): string {
  return options
    .map((option, i) => {
      const separator = i > 0 ? "/" : "";
      return i === chosen ? strike(separator) + option : strike(separator + option);
    })
    .join("");
}

/** Formats "building/flat", omitting the flat when there is none. */
function houseNumber(buildingNumber: string, flatNumber: string | null): string {
  return flatNumber ? `${buildingNumber}/${flatNumber}` : buildingNumber;
}

/** Text for the PESEL field: the PESEL, or the ID document and birth date for people without one. */
function identity(employee: ReferralSnapshot["employee"]): string {
  if (employee.pesel) {
    return employee.pesel;
  }
  const parts = [employee.idDocumentNumber, employee.idDocumentName].filter((part) => part);
  if (employee.birthDate) {
    parts.push(`data urodzenia: ${employee.birthDate}`);
  }
  return parts.join(", ");
}

/** Factors of one category as flowing "name – exposure" items. */
function factorItems(factors: ReferralSnapshot["factors"], category: RiskCategory): string {
  return factors
    .filter((factor) => factor.category === category)
    .map((factor) => {
      const exposure = factor.exposureLevel ? ` – ${escapeHtml(factor.exposureLevel)}` : "";
      return `<span class="factor">${escapeHtml(factor.name)}${exposure}</span>`;
    })
    .join("");
}

/**
 * Renders a referral snapshot as a self-contained HTML copy of the official form (Annex 3a, Dz.U. 2023 poz. 607),
 * ready to print to A4. Ported from docs/research/referral-template/referral.html.
 */
export function renderReferralHtml(snapshot: ReferralSnapshot): string {
  const { employer, employee } = snapshot;
  const female = employee.sex === "FEMALE" ? 1 : 0;
  const employed = snapshot.employmentStatus === "EMPLOYED";
  const employerLines = [
    employer.name,
    `${employer.street || employer.city} ${houseNumber(employer.buildingNumber, employer.flatNumber)}`,
    `${employer.postalCode} ${employer.city}`,
    `NIP ${employer.nip}`,
  ];
  const homeNumber = houseNumber(employee.buildingNumber, employee.flatNumber);
  const address = employee.street ? `${employee.city}, ${employee.street} ${homeNumber}` : `${employee.city} ${homeNumber}`;
  const categories = CATEGORIES.map(
    ({ category, no, title }) => `
  <div class="cat">
    <div class="no">${no}</div>
    <div class="body">
      <div class="title">${title}</div>
      <div class="items">${factorItems(snapshot.factors, category)}</div>
    </div>
  </div>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>Skierowanie na badania lekarskie</title>
<style>${STYLES}</style>
</head>
<body>
<section class="form">
  <div class="head">
    <div>
      <div class="val">${employerLines.map(escapeHtml).join("<br>")}</div>
      <span class="cap">(oznaczenie pracodawcy)</span>
    </div>
    <div>
      <div class="val right"><span>${escapeHtml(`${snapshot.issuePlace}, ${snapshot.issueDate}`)}</span></div>
      <span class="cap">(miejscowość, data)</span>
    </div>
  </div>

  <h1>Skierowanie na badania lekarskie</h1>
  <p class="exam">(${pick(["wstępne", "okresowe", "kontrolne"], EXAM_TYPES.indexOf(snapshot.examType))}<sup>*)</sup>)</p>

  <p class="law">Działając na podstawie art. 229 § 4a ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy (Dz. U. z 2022 r. poz. 1510, z późn. zm.), kieruję na badania lekarskie:</p>

  <p class="line" style="margin-bottom:0">
    ${pick(["Pana", "Panią"], female)}<sup>*)</sup>
    <span class="fill">${escapeHtml(`${employee.firstName} ${employee.lastName}`)}</span>,
  </p>
  <span class="cap after-cap" style="margin-left:40mm">(imię i nazwisko)</span>

  <p class="line">nr PESEL<sup>**)</sup> <span class="fill">${escapeHtml(identity(employee))}</span>,</p>

  <p class="line" style="margin-bottom:0; margin-top:4mm">
    ${pick(["zamieszkałego", "zamieszkałą"], female)}<sup>*)</sup>
    <span class="fill">${escapeHtml(address)}</span>,
  </p>
  <span class="cap after-cap" style="margin-left:50mm">(miejscowość, ulica, nr domu, nr lokalu)</span>

  <p class="block-fill" style="margin-top:4mm">
    ${pick(["zatrudnionego", "zatrudnioną"], employed ? female : -1)}<sup>*)</sup> lub
    ${pick(["podejmującego", "podejmującą"], employed ? -1 : female)}<sup>*)</sup>
    pracę na stanowisku lub stanowiskach pracy
    <span class="fill">${escapeHtml(snapshot.position)}</span>,
  </p>

  <p class="block-fill" style="margin-top:2mm">
    określenie ${pick(["stanowiska", "stanowisk"], 0)}<sup>*)</sup> pracy<sup>***)</sup>:
    <span class="fill">${escapeHtml(snapshot.workDescription)}</span>
  </p>

  <p class="conditions">Opis warunków pracy uwzględniający informacje o występowaniu na stanowisku lub stanowiskach pracy czynników niebezpiecznych, szkodliwych dla zdrowia lub czynników uciążliwych i innych wynikających ze sposobu wykonywania pracy, z podaniem wielkości narażenia oraz aktualnych wyników badań i pomiarów czynników szkodliwych dla zdrowia, wykonanych na tym stanowisku/stanowiskach – należy wpisać nazwę czynnika/czynników i wielkość/wielkości narażenia<sup>****)</sup>:</p>
${categories}

  <div class="closing-block">
  <div class="total">
    <div class="text">Łączna liczba czynników niebezpiecznych, szkodliwych dla zdrowia lub czynników uciążliwych i innych wynikających ze sposobu wykonywania pracy wskazanych w skierowaniu:</div>
    <div class="box">${snapshot.factors.length}</div>
  </div>

  <div class="sign">
    <div class="line-dots"></div>
    <span class="cap">(podpis pracodawcy)</span>
  </div>
  </div>
</section>

<section class="notes">
  <h2>Objaśnienia:</h2>
  <div class="row"><div class="mk">*)</div><div class="txt">Niepotrzebne skreślić.</div></div>
  <div class="row"><div class="mk">**)</div><div class="txt">W przypadku osoby, której nie nadano numeru PESEL – seria, numer i nazwa dokumentu potwierdzającego tożsamość, a w przypadku osoby przyjmowanej do pracy – data urodzenia.</div></div>
  <div class="row"><div class="mk">***)</div><div class="txt">Opisać: rodzaj pracy, podstawowe czynności, sposób i czas ich wykonywania.</div></div>
  <div class="row"><div class="mk">****)</div><div class="txt">
    Opis warunków pracy uwzględniający w szczególności przepisy:
    <ul>
      <li><span>1)</span><span>wydane na podstawie:
        <ul class="sub">
          <li><span>a)</span><span>art. 222 § 3 ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy dotyczące wykazu substancji chemicznych, ich mieszanin, czynników lub procesów technologicznych o działaniu rakotwórczym lub mutagennym,</span></li>
          <li><span>b)</span><span>art. 222<sup>1</sup> § 3 ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy dotyczące wykazu szkodliwych czynników biologicznych,</span></li>
          <li><span>c)</span><span>art. 227 § 2 ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy dotyczące badań i pomiarów czynników szkodliwych dla zdrowia,</span></li>
          <li><span>d)</span><span>art. 228 § 3 ustawy z dnia 26 czerwca 1974 r. – Kodeks pracy dotyczące wykazu najwyższych dopuszczalnych stężeń i natężeń czynników szkodliwych dla zdrowia w środowisku pracy,</span></li>
          <li><span>e)</span><span>art. 25 pkt 1 ustawy z dnia 29 listopada 2000 r. – Prawo atomowe (Dz. U. z 2021 r. poz. 1941 oraz z 2022 r. poz. 974) dotyczące wskaźników pozwalających na wyznaczenie dawek promieniowania jonizującego stosowanych przy ocenie narażenia na promieniowanie jonizujące;</span></li>
        </ul></span></li>
      <li><span>2)</span><span>załącznika nr 1 do rozporządzenia Ministra Zdrowia i Opieki Społecznej z dnia 30 maja 1996 r. w sprawie przeprowadzania badań lekarskich pracowników, zakresu profilaktycznej opieki zdrowotnej nad pracownikami oraz orzeczeń lekarskich wydawanych do celów przewidzianych w Kodeksie pracy (Dz. U. z 2023 r. poz. 607)</span></li>
    </ul>
  </div></div>
  <p class="closing">Skierowanie na badania lekarskie jest wydawane w dwóch egzemplarzach, z których jeden otrzymuje osoba kierowana na badania.</p>
</section>
</body>
</html>`;
}

const STYLES = `
  @page { size: A4; margin: 15mm 20mm 14mm 20mm; }
  * { box-sizing: border-box; }
  html { font-family: "Liberation Serif", "Tinos", "Times New Roman", serif; font-size: 11.5pt; line-height: 1.25; color: #000; }
  body { margin: 0; }
  p { margin: 0; }
  sup { font-size: 60%; line-height: 0; vertical-align: super; }
  .cap { display: block; text-align: center; font-size: 9pt; line-height: 1.1; }
  .strike { text-decoration: line-through; }

  .head { display: flex; justify-content: space-between; gap: 20mm; }
  .head > div { width: 46%; }
  .head .val { min-height: 2.6em; border-bottom: 1px dotted #000; padding: 0 1mm; }
  .head .val.right { text-align: center; display: flex; align-items: flex-end; justify-content: center; }

  h1 { font-size: 12pt; text-align: center; font-weight: bold; margin: 6mm 0 0; text-transform: uppercase; }
  .exam { text-align: center; font-weight: bold; margin-bottom: 5mm; }
  .law { text-align: justify; margin-bottom: 4mm; }

  .line { margin-bottom: 2mm; text-align: justify; }
  .fill { border-bottom: 1px dotted #000; padding: 0 1mm; white-space: pre-line; }
  .block-fill { text-align: justify; }
  .after-cap { margin-bottom: 3mm; }

  .conditions { text-align: justify; margin: 3mm 0 4mm; }
  .cat { display: flex; gap: 4mm; margin-bottom: 4mm; break-inside: avoid-page; }
  .cat .no { width: 9mm; flex: none; }
  .cat .body { flex: 1; }
  .cat .items { margin-top: 0.5mm; }
  .cat .items .factor { display: inline; }
  .cat .items .factor:not(:last-child)::after { content: "; "; }
  .cat .items .factor:last-child::after { content: "."; }
  .cat .items:empty { display: none; }

  .closing-block { break-inside: avoid; }
  .total { display: flex; align-items: flex-start; gap: 6mm; margin-top: 5mm; break-inside: avoid; }
  .total .text { flex: 1; text-align: justify; }
  .total .box { width: 30mm; height: 13mm; border: 1px solid #000; flex: none; display: flex; align-items: center; justify-content: center; font-size: 14pt; margin-top: 3mm; }

  .sign { margin: 6mm 0 0 auto; width: 70mm; text-align: center; break-inside: avoid; }
  .sign .line-dots { border-bottom: 1px dotted #000; height: 8mm; }

  .notes { break-before: page; page-break-before: always; font-size: 10.5pt; line-height: 1.3; }
  .notes h2 { font-size: 12pt; margin: 0 0 3mm; font-weight: normal; }
  .notes .row { display: flex; gap: 4mm; margin-bottom: 2mm; }
  .notes .mk { width: 9mm; flex: none; }
  .notes .txt { flex: 1; text-align: justify; }
  .notes ul { list-style: none; margin: 1mm 0; padding: 0; }
  .notes li { display: flex; gap: 3mm; margin-bottom: 1mm; }
  .notes li > span:first-child { width: 7mm; flex: none; }
  .notes .closing { margin-top: 6mm; text-align: justify; }
`;
