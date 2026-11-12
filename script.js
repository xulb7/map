// بيانات الكلية المطابقة لمخططات المرفقة
const campusData = {
  A: {
    "الدور الأرضي": {
      corridorsSvg: `
        <rect x="198" y="104" width="64" height="416" fill="#0f172a" stroke="#334155" />
        <rect x="147" y="470" width="506" height="50" fill="#0f172a" stroke="#334155" />
        <polygon points="346,258 462,254 556,325 541,336 462,340 458,404 376,404 346,396" fill="#0f172a" stroke="#334155" />
        <rect x="204" y="108" width="58" height="56" fill="#475569" stroke="#334155" />
        <rect x="504" y="261" width="38" height="34" fill="#475569" stroke="#334155" />
        <rect x="370" y="404" width="85" height="68" fill="#475569" stroke="#334155" />
        <rect x="654" y="475" width="79" height="45" fill="#475569" stroke="#334155" />
        <rect x="462" y="340" width="79" height="68" fill="#0f172a" stroke="#334155" />
        <rect x="261" y="580" width="55" height="62" fill="#0f172a" stroke="#334155" />
        <rect x="318" y="580" width="72" height="62" fill="#0f172a" stroke="#334155" />
        <rect x="206" y="70" width="35" height="35" fill="#16a34a" stroke="#334155" />
        <rect x="464" y="240" width="35" height="32" fill="#16a34a" stroke="#334155" />
        <rect x="736" y="485" width="34" height="32" fill="#16a34a" stroke="#334155" />
        <rect x="57" y="62" width="8" height="8" fill="#dc2626" />
        <rect x="57" y="136" width="8" height="8" fill="#dc2626" />
        <rect x="57" y="167" width="8" height="8" fill="#dc2626" />
        <rect x="177" y="211" width="8" height="8" fill="#dc2626" />
        <rect x="173" y="301" width="8" height="8" fill="#dc2626" />
        <rect x="211" y="301" width="8" height="8" fill="#dc2626" />
        <rect x="56" y="346" width="8" height="8" fill="#dc2626" />
        <rect x="411" y="271" width="8" height="8" fill="#dc2626" />
        <rect x="173" y="484" width="8" height="8" fill="#dc2626" />
        <rect x="501" y="500" width="8" height="8" fill="#dc2626" />
        <rect x="346" y="437" width="8" height="8" fill="#dc2626" />
        <polyline points="232,482 232,171" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="232,486 474,299" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="354,332 444,323" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="444,381 470,314" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="158,495 638,495" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
      `,
      rooms: [
        { id: "A-G-1", label: "A-G-1", x: 46, y: 53, w: 154, h: 100, routePoints: "232,495 232,102 200,102" },
        { id: "A-G-2", label: "A-G-2", x: 46, y: 156, w: 154, h: 101, routePoints: "232,495 232,207 200,207" },
        { id: "A-G-3", label: "A-G-3", x: 44, y: 263, w: 153, h: 100, routePoints: "232,495 232,312 198,312" },
        { id: "A-G-4", label: "A-G-4", x: 42, y: 366, w: 155, h: 101, routePoints: "232,495 232,417 198,417" },
        { id: "A-G-5", label: "A-G-5", x: 42, y: 470, w: 105, h: 48, routePoints: "232,495 147,495" },
        { id: "A-G-6", label: "A-G-6", x: 40, y: 520, w: 150, h: 122, routePoints: "232,495 232,501 166,501 166,520" },
        { id: "A-G-7", label: "A-G-7", x: 196, y: 520, w: 62, h: 122, routePoints: "232,495 226,495 226,520" },
        { id: "A-G-8", label: "A-G-8", x: 261, y: 520, w: 128, h: 56, routePoints: "232,495 324,495 324,520" },
        { id: "A-G-9", label: "A-G-9", x: 395, y: 522, w: 133, h: 120, routePoints: "232,495 462,495 462,522" },
        { id: "A-G-10", label: "A-G-10", x: 532, y: 522, w: 128, h: 120, routePoints: "232,495 594,495 594,522" },
        { id: "A-G-11", label: "A-G-11", x: 661, y: 522, w: 135, h: 120, routePoints: "232,495 728,495 728,522" },
        { id: "A-G-12", label: "A-G-12", x: 265, y: 345, w: 81, h: 51, routePoints: "232,495 232,371 265,371" },
        { id: "A-G-13", label: "A-G-13", x: 264, y: 284, w: 81, h: 60, routePoints: "232,495 232,314 264,314" },
        { id: "A-G-14", label: "A-G-14", x: 260, y: 104, w: 94, h: 176, routePoints: "232,495 232,192 260,192" },
        { id: "A-G-15", label: "A-G-15", x: 458, y: 404, w: 244, h: 68, routePoints: "232,495 548,495 548,471" },
        { id: "A-G-15-1", label: "A-G-15-1", x: 632, y: 441, w: 107, h: 38, routePoints: "232,495 684,495 684,479" }
      ]
    },
    "الدور الأول": {
      corridorsSvg: `
        <rect x="190" y="96" width="58" height="424" fill="#0f172a" stroke="#334155" />
        <rect x="140" y="471" width="536" height="49" fill="#0f172a" stroke="#334155" />
        <rect x="322" y="254" width="43" height="154" fill="#0f172a" stroke="#334155" />
        <polygon points="248,396 346,471 425,471 425,396" fill="#0f172a" stroke="#334155" />
        <rect x="365" y="362" width="199" height="45" fill="#0f172a" stroke="#334155" />
        <rect x="192" y="92" width="56" height="64" fill="#475569" stroke="#334155" />
        <rect x="597" y="475" width="75" height="43" fill="#475569" stroke="#334155" />
        <rect x="350" y="404" width="68" height="68" fill="#475569" stroke="#334155" />
        <rect x="635" y="430" width="49" height="41" fill="#475569" stroke="#334155" />
        <rect x="368" y="228" width="98" height="71" fill="#475569" stroke="#334155" />
        <polygon points="252,92 331,164 252,164" fill="#0f172a" stroke="#334155" />
        <rect x="247" y="168" width="35" height="103" fill="#0f172a" stroke="#334155" />
        <polygon points="312,168 354,168 395,216 395,252 312,252" fill="#0f172a" stroke="#334155" />
        <rect x="202" y="55" width="39" height="35" fill="#16a34a" stroke="#334155" />
        <rect x="374" y="419" width="41" height="39" fill="#16a34a" stroke="#334155" />
        <rect x="674" y="479" width="40" height="36" fill="#16a34a" stroke="#334155" />
        <rect x="173" y="62" width="8" height="8" fill="#dc2626" />
        <rect x="203" y="201" width="8" height="8" fill="#dc2626" />
        <rect x="344" y="266" width="8" height="8" fill="#dc2626" />
        <rect x="166" y="481" width="8" height="8" fill="#dc2626" />
        <rect x="571" y="535" width="8" height="8" fill="#dc2626" />
        <rect x="520" y="623" width="8" height="8" fill="#dc2626" />
        <rect x="713" y="623" width="8" height="8" fill="#dc2626" />
        <polyline points="151,492 582,492" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="220,479 220,175" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="220,479 327,415" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="338,284 338,404 346,426" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="372,381 522,389" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
      `,
      rooms: [
        { id: "A-F-1", label: "A-F-1", x: 52, y: 40, w: 138, h: 208, routePoints: "220,492 220,141 190,141" },
        { id: "A-F-2", label: "A-F-2", x: 50, y: 252, w: 140, h: 103, routePoints: "220,492 220,303 190,303" },
        { id: "A-F-3", label: "A-F-3", x: 46, y: 359, w: 139, h: 109, routePoints: "220,492 220,413 185,413" },
        { id: "A-F-4", label: "A-F-4", x: 44, y: 471, w: 95, h: 44, routePoints: "220,492 140,492" },
        { id: "A-F-5", label: "A-F-5", x: 40, y: 520, w: 140, h: 120, routePoints: "220,492 220,501 158,501 158,520" },
        { id: "A-F-6", label: "A-F-6", x: 182, y: 520, w: 53, h: 120, routePoints: "220,492 210,492 210,520" },
        { id: "A-F-7", label: "A-F-7", x: 241, y: 520, w: 120, h: 120, routePoints: "220,492 301,492 301,520" },
        { id: "A-F-8", label: "A-F-8", x: 366, y: 522, w: 121, h: 118, routePoints: "220,492 426,492 426,522" },
        { id: "A-F-9", label: "A-F-9", x: 490, y: 520, w: 242, h: 120, routePoints: "220,492 608,492 608,520" },
        { id: "A-F-10", label: "A-F-10", x: 425, y: 408, w: 90, h: 64, routePoints: "220,492 470,492 470,471" },
        { id: "A-F-11", label: "A-F-11", x: 247, y: 344, w: 75, h: 51, routePoints: "220,492 220,369 247,369" },
        { id: "A-F-13", label: "A-F-13\n(العميدة)", x: 516, y: 381, w: 118, h: 90, type: "blue-bg", routePoints: "220,492 571,492 571,471" },
        { id: "A-F-14", label: "A-F-14", x: 362, y: 300, w: 158, h: 62, routePoints: "220,492 335,415 342,404 342,329 362,329" },
        { id: "A-F-17", label: "A-F-17", x: 248, y: 272, w: 73, h: 68, routePoints: "220,492 220,306 248,306" }
      ]
    }
  },
  B: {
    "الدور الأرضي": {
      corridorsSvg: `
        <rect x="255" y="78" width="38" height="204" fill="#0f172a" stroke="#334155" />
        <rect x="109" y="282" width="208" height="160" fill="#0f172a" stroke="#334155" />
        <rect x="251" y="442" width="41" height="267" fill="#0f172a" stroke="#334155" />
        <rect x="294" y="83" width="140" height="119" fill="#475569" stroke="#334155" />
        <rect x="93" y="282" width="18" height="44" fill="#475569" stroke="#334155" />
        <rect x="93" y="398" width="18" height="44" fill="#475569" stroke="#334155" />
        <rect x="261" y="72" width="30" height="26" fill="#16a34a" stroke="#334155" />
        <rect x="98" y="348" width="30" height="28" fill="#16a34a" stroke="#334155" />
        <rect x="257" y="700" width="31" height="28" fill="#16a34a" stroke="#334155" />
        <rect x="265" y="179" width="8" height="8" fill="#dc2626" />
        <rect x="136" y="289" width="8" height="8" fill="#dc2626" />
        <rect x="138" y="427" width="8" height="8" fill="#dc2626" />
        <rect x="301" y="377" width="8" height="8" fill="#dc2626" />
        <rect x="232" y="212" width="8" height="8" fill="#dc2626" />
        <rect x="224" y="271" width="8" height="8" fill="#dc2626" />
        <rect x="402" y="570" width="8" height="8" fill="#dc2626" />
        <rect x="313" y="586" width="8" height="8" fill="#dc2626" />
        <rect x="279" y="666" width="8" height="8" fill="#dc2626" />
        <polyline points="284,354 284,114" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="284,366 137,366" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="115,308 228,308 228,418 112,418" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="270,384 270,689" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="296,186 360,186" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <rect x="376" y="286" width="72" height="74" fill="#0f172a" stroke="#334155" />
        <rect x="294" y="538" width="121" height="63" fill="#0f172a" stroke="#334155" />
        <rect x="294" y="605" width="72" height="106" fill="#0f172a" stroke="#334155" />
        <rect x="365" y="605" width="66" height="106" fill="#0f172a" stroke="#334155" />
        <rect x="112" y="521" width="69" height="80" fill="#0f172a" stroke="#334155" />
      `,
      rooms: [
        { id: "B-G-11", label: "B-G-11", x: 119, y: 85, w: 136, h: 119, routePoints: "277,366 284,366 284,144 255,144" },
        { id: "B-G-12", label: "B-G-12", x: 118, y: 207, w: 135, h: 75, routePoints: "277,366 284,366 284,245 252,245" },
        { id: "B-G-7", label: "B-G-7", x: 365, y: 153, w: 69, h: 50, routePoints: "277,366 284,366 284,186 365,186" },
        { id: "B-G-6", label: "B-G-6", x: 294, y: 208, w: 138, h: 74, routePoints: "277,366 284,366 284,245 294,245" },
        { id: "B-G-5", label: "B-G-5", x: 317, y: 285, w: 59, h: 75, routePoints: "277,366 284,366 284,322 317,322" },
        { id: "B-G-4", label: "B-G-4", x: 314, y: 362, w: 136, h: 77, routePoints: "277,366 270,366 270,400 314,400" },
        { id: "B-G-3", label: "B-G-3", x: 292, y: 442, w: 139, h: 77, routePoints: "277,366 270,366 270,480 292,480" },
        { id: "B-G-13", label: "B-G-13", x: 109, y: 444, w: 140, h: 72, routePoints: "277,366 270,366 270,480 250,480" },
        { id: "B-G-14", label: "B-G-14", x: 181, y: 521, w: 70, h: 80, routePoints: "277,366 270,366 270,561 251,561" },
        { id: "B-G-15", label: "B-G-15", x: 112, y: 602, w: 139, h: 103, routePoints: "277,366 270,366 270,654 251,654" }
      ]
    },
    "الدور الأول": {
      corridorsSvg: `
        <rect x="252" y="78" width="44" height="195" fill="#0f172a" stroke="#334155" />
        <rect x="87" y="274" width="228" height="160" fill="#0f172a" stroke="#334155" />
        <rect x="247" y="433" width="47" height="264" fill="#0f172a" stroke="#334155" />
        <rect x="332" y="76" width="116" height="75" fill="#475569" stroke="#334155" />
        <rect x="248" y="645" width="39" height="51" fill="#475569" stroke="#334155" />
        <rect x="74" y="275" width="14" height="37" fill="#475569" stroke="#334155" />
        <rect x="69" y="391" width="15" height="38" fill="#475569" stroke="#334155" />
        <rect x="256" y="100" width="18" height="30" fill="#475569" stroke="#334155" />
        <rect x="214" y="304" width="72" height="96" fill="#020617" stroke="#334155" />
        <rect x="255" y="58" width="44" height="37" fill="#16a34a" stroke="#334155" />
        <rect x="30" y="274" width="41" height="36" fill="#16a34a" stroke="#334155" />
        <rect x="21" y="389" width="40" height="38" fill="#16a34a" stroke="#334155" />
        <rect x="103" y="128" width="8" height="8" fill="#dc2626" />
        <rect x="235" y="149" width="8" height="8" fill="#dc2626" />
        <rect x="265" y="149" width="8" height="8" fill="#dc2626" />
        <rect x="199" y="281" width="8" height="8" fill="#dc2626" />
        <rect x="300" y="360" width="8" height="8" fill="#dc2626" />
        <rect x="196" y="416" width="8" height="8" fill="#dc2626" />
        <rect x="324" y="520" width="8" height="8" fill="#dc2626" />
        <rect x="273" y="549" width="8" height="8" fill="#dc2626" />
        <rect x="207" y="601" width="8" height="8" fill="#dc2626" />
        <rect x="108" y="682" width="8" height="8" fill="#dc2626" />
        <polyline points="270,634 270,409 101,409" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="302,409 302,295 104,295" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="200,295 200,409" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="285,295 285,114" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="299,179 368,179" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
      `,
      rooms: [
        { id: "B-F-11", label: "B-F-11", x: 96, y: 74, w: 157, h: 119, routePoints: "270,409 302,409 302,295 285,295 285,134 252,134" },
        { id: "B-F-12", label: "B-F-12", x: 93, y: 195, w: 157, h: 77, routePoints: "270,409 302,409 302,295 285,295 285,234 250,234" },
        { id: "B-F-10", label: "B-F-10", x: 299, y: 78, w: 31, h: 85, routePoints: "270,409 302,409 302,295 285,295 285,121 299,121" },
        { id: "B-F-07", label: "B-F-07", x: 382, y: 151, w: 63, h: 48, routePoints: "270,409 302,409 302,295 285,295 285,179 382,179" },
        { id: "B-F-06", label: "B-F-06", x: 296, y: 200, w: 148, h: 74, routePoints: "270,409 302,409 302,295 285,295 285,237 296,237" },
        { id: "B-F-05", label: "B-F-05", x: 316, y: 275, w: 154, h: 78, routePoints: "270,409 302,409 302,314 316,314" },
        { id: "B-F-04", label: "B-F-04", x: 316, y: 355, w: 151, h: 75, routePoints: "270,409 302,409 302,392 316,392" },
        { id: "B-F-03", label: "B-F-03", x: 294, y: 433, w: 148, h: 75, routePoints: "270,409 270,471 294,471" },
        { id: "B-F-02", label: "B-F-02", x: 294, y: 512, w: 148, h: 78, routePoints: "270,409 270,551 294,551" },
        { id: "B-F-01", label: "B-F-01", x: 293, y: 593, w: 150, h: 105, routePoints: "270,409 270,645 293,645" },
        { id: "B-F-14", label: "B-F-14", x: 90, y: 433, w: 157, h: 75, routePoints: "270,409 270,471 247,471" },
        { id: "B-F-15", label: "B-F-15", x: 90, y: 512, w: 157, h: 77, routePoints: "270,409 270,550 247,550" },
        { id: "B-F-16", label: "B-F-16", x: 85, y: 591, w: 160, h: 105, routePoints: "270,409 270,643 244,643" },
        { id: "B-F-13", label: "B-F-13", x: 71, y: 314, w: 116, h: 75, routePoints: "270,409 129,409 129,389" }
      ]
    },
    "الدور الثاني": {
      corridorsSvg: `
        <rect x="263" y="78" width="35" height="190" fill="#0f172a" stroke="#334155" />
        <rect x="94" y="268" width="220" height="162" fill="#0f172a" stroke="#334155" />
        <rect x="245" y="431" width="38" height="272" fill="#0f172a" stroke="#334155" />
        <rect x="336" y="65" width="113" height="91" fill="#475569" stroke="#334155" />
        <rect x="242" y="650" width="38" height="52" fill="#475569" stroke="#334155" />
        <rect x="83" y="270" width="15" height="40" fill="#475569" stroke="#334155" />
        <rect x="83" y="389" width="15" height="38" fill="#475569" stroke="#334155" />
        <rect x="264" y="81" width="16" height="50" fill="#475569" stroke="#334155" />
        <rect x="215" y="301" width="69" height="96" fill="#020617" stroke="#334155" />
        <rect x="263" y="40" width="43" height="38" fill="#16a34a" stroke="#334155" />
        <rect x="31" y="266" width="44" height="40" fill="#16a34a" stroke="#334155" />
        <rect x="24" y="386" width="45" height="40" fill="#16a34a" stroke="#334155" />
        <rect x="120" y="74" width="8" height="8" fill="#dc2626" />
        <rect x="216" y="169" width="8" height="8" fill="#dc2626" />
        <rect x="272" y="138" width="8" height="8" fill="#dc2626" />
        <rect x="176" y="277" width="8" height="8" fill="#dc2626" />
        <rect x="296" y="359" width="8" height="8" fill="#dc2626" />
        <rect x="175" y="413" width="8" height="8" fill="#dc2626" />
        <rect x="266" y="556" width="8" height="8" fill="#dc2626" />
        <polyline points="270,648 270,406 108,406" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="298,406 298,290 105,290" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="198,290 198,406" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="286,290 286,106" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
        <polyline points="366,171 303,171" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4" />
      `,
      rooms: [
        { id: "B-S-11", label: "B-S-11", x: 108, y: 63, w: 151, h: 124, routePoints: "270,406 298,406 298,290 286,290 286,125 259,125" },
        { id: "B-S-12", label: "B-S-12", x: 103, y: 188, w: 153, h: 80, routePoints: "270,406 298,406 298,290 286,290 286,228 256,228" },
        { id: "B-S-10", label: "B-S-10", x: 306, y: 70, w: 30, h: 85, routePoints: "270,406 298,406 298,290 286,290 286,113 306,113" },
        { id: "B-S-07", label: "B-S-07", x: 377, y: 156, w: 72, h: 32, routePoints: "270,406 298,406 298,290 286,290 286,171 377,171" },
        { id: "B-S-06", label: "B-S-06", x: 298, y: 193, w: 151, h: 77, routePoints: "270,406 298,406 298,231" },
        { id: "B-S-05", label: "B-S-05", x: 314, y: 272, w: 152, h: 79, routePoints: "270,406 298,406 298,311 314,311" },
        { id: "B-S-04", label: "B-S-04", x: 314, y: 352, w: 147, h: 78, routePoints: "270,406 298,406 298,391 314,391" },
        { id: "B-S-03", label: "B-S-03", x: 292, y: 433, w: 146, h: 75, routePoints: "270,406 270,471 292,471" },
        { id: "B-S-02", label: "B-S-02", x: 289, y: 512, w: 147, h: 81, routePoints: "270,406 270,552 289,552" },
        { id: "B-S-01", label: "B-S-01", x: 284, y: 598, w: 151, h: 105, routePoints: "270,406 270,650 284,650" },
        { id: "B-S-15", label: "B-S-15", x: 91, y: 432, w: 155, h: 79, routePoints: "270,406 270,471 246,471" },
        { id: "B-S-16", label: "B-S-16", x: 91, y: 513, w: 154, h: 80, routePoints: "270,406 270,553 245,553" },
        { id: "B-S-17", label: "B-S-17", x: 83, y: 596, w: 160, h: 110, routePoints: "270,406 270,650 242,650" },
        { id: "B-S-14", label: "B-S-14", x: 79, y: 313, w: 52, h: 69, routePoints: "270,406 105,406 105,382" },
        { id: "B-S-13", label: "B-S-13", x: 132, y: 313, w: 50, h: 69, routePoints: "270,406 157,406 157,382" }
      ]
    }
  }
};

let selectedBldg = 'A';
let selectedFloor = 'الدور الأرضي';

let scale = 1;
let pointX = 0;
let pointY = 0;
let startX = 0;
let startY = 0;
let isDragging = false;

const board = document.getElementById('blueprintBoard');
const wrapper = document.getElementById('mapWrapper');

window.onload = function() {
  renderFloorsMenu();
  renderBlueprint();
  initPanZoom();
};

function initPanZoom() {
  setupBoard();
  wrapper.style.touchAction = 'none';
  wrapper.style.userSelect = 'none';
  wrapper.style.overscrollBehavior = 'none';

  const pointers = new Map();
  let moved = false;
  let pinchDist = 0;

  const local = (e) => {
    const r = wrapper.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  wrapper.onpointerdown = function(e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      startX = e.clientX - pointX;
      startY = e.clientY - pointY;
      moved = false;
      isDragging = true;
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      isDragging = false;
    }
  };

  wrapper.onpointermove = function(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = wrapper.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - r.left;
      const cy = (a.y + b.y) / 2 - r.top;
      if (pinchDist > 0) zoomAt(cx, cy, dist / pinchDist);
      pinchDist = dist;
      moved = true;
      return;
    }

    if (!isDragging) return;
    const nx = e.clientX - startX;
    const ny = e.clientY - startY;
    if (!moved && Math.hypot(nx - pointX, ny - pointY) < 6) return;
    if (!moved) {
      moved = true;
      try { wrapper.setPointerCapture(e.pointerId); } catch (err) {}
    }
    pointX = nx;
    pointY = ny;
    updateTransform();
  };

  const endPointer = function(e) {
    pointers.delete(e.pointerId);
    pinchDist = 0;
    if (pointers.size === 1) {
      const p = [...pointers.values()][0];
      startX = p.x - pointX;
      startY = p.y - pointY;
      isDragging = true;
    } else {
      isDragging = false;
    }
  };
  wrapper.onpointerup = endPointer;
  wrapper.onpointercancel = endPointer;
  wrapper.onlostpointercapture = endPointer;

  // التاتش باد: تحريك بإصبعين = تحريك الخريطة، وقرص (أو Ctrl + عجلة) = تكبير
  wrapper.onwheel = function(e) {
    e.preventDefault();
    if (e.ctrlKey) {
      const p = local(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.01));
    } else {
      pointX -= e.deltaX;
      pointY -= e.deltaY;
      updateTransform();
    }
  };

  window.addEventListener('orientationchange', () => setTimeout(fitToScreen, 300));
  window.addEventListener('resize', () => updateTransform());
}

function setupBoard() {
  wrapper.style.display = 'block';
  wrapper.style.position = 'relative';
  wrapper.style.overflow = 'hidden';
  board.style.position = 'absolute';
  board.style.left = '0px';
  board.style.top = '0px';
  board.style.transition = 'none';
  board.style.transformOrigin = '0 0';
}

function zoomAt(cx, cy, factor) {
  const newScale = Math.min(Math.max(0.25, scale * factor), 3);
  const real = newScale / scale;
  pointX = cx - (cx - pointX) * real;
  pointY = cy - (cy - pointY) * real;
  scale = newScale;
  updateTransform();
}

function updateTransform() {
  clampPan();
  board.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
}

function zoomIn() {
  zoomAt(wrapper.clientWidth / 2, wrapper.clientHeight / 2, 1.2);
}

function zoomOut() {
  zoomAt(wrapper.clientWidth / 2, wrapper.clientHeight / 2, 1 / 1.2);
}

function resetZoom() {
  fitToScreen();
}

// حدود محتوى الدور الحالي (القاعات + الممرات) لتوسيط الخريطة ومنع السحب للفراغ
let viewBounds = null;

function computeBounds() {
  const rooms = campusData[selectedBldg][selectedFloor].rooms;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  rooms.forEach(r => {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  });
  try {
    const bb = document.getElementById('corridorSvg').getBBox();
    if (bb && bb.width > 0 && bb.height > 0) {
      minX = Math.min(minX, bb.x);
      minY = Math.min(minY, bb.y);
      maxX = Math.max(maxX, bb.x + bb.width);
      maxY = Math.max(maxY, bb.y + bb.height);
    }
  } catch (err) {}
  const pad = 16;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

function viewMetrics() {
  const header = document.getElementById('topControls');
  let topPad = 0;
  if (header) {
    const pos = getComputedStyle(header).position;
    if (pos === 'absolute' || pos === 'fixed') topPad = header.offsetHeight + 10;
  }
  return { w: wrapper.clientWidth, h: wrapper.clientHeight, topPad };
}

// تثبيت الخريطة داخل الشاشة: إن كانت أصغر من الشاشة تتوسّط وتثبت، وإن كانت مكبّرة لا تخرج حوافها للفراغ
function clampPan() {
  const b = viewBounds, v = viewMetrics();
  if (!b || !v.w || !v.h) return;
  const cw = (b.maxX - b.minX) * scale, ch = (b.maxY - b.minY) * scale;
  const availH = v.h - v.topPad;
  if (cw <= v.w) pointX = (v.w - cw) / 2 - b.minX * scale;
  else pointX = Math.min(-b.minX * scale, Math.max(v.w - b.maxX * scale, pointX));
  if (ch <= availH) pointY = v.topPad + (availH - ch) / 2 - b.minY * scale;
  else pointY = Math.min(v.topPad - b.minY * scale, Math.max(v.h - b.maxY * scale, pointY));
}

function fitToScreen() {
  setupBoard();
  viewBounds = computeBounds();
  const v = viewMetrics();
  const bw = viewBounds.maxX - viewBounds.minX;
  const bh = viewBounds.maxY - viewBounds.minY;
  const availH = v.h - v.topPad;
  scale = Math.max(Math.min(v.w / bw, availH / bh, 1), 0.25);
  pointX = (v.w - bw * scale) / 2 - viewBounds.minX * scale;
  pointY = v.topPad + (availH - bh * scale) / 2 - viewBounds.minY * scale;
  updateTransform();
}

function selectBuilding(b) {
  selectedBldg = b;
  document.getElementById('bldg-A').classList.toggle('active', b === 'A');
  document.getElementById('bldg-B').classList.toggle('active', b === 'B');

  selectedFloor = Object.keys(campusData[b])[0];
  renderFloorsMenu();
  renderBlueprint();
  clearNavigation();
}

function renderFloorsMenu() {
  const container = document.getElementById('floorSelector');
  container.innerHTML = '';

  Object.keys(campusData[selectedBldg]).forEach(fl => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${fl === selectedFloor ? 'active' : ''}`;
    btn.innerText = fl;
    btn.onclick = () => {
      selectedFloor = fl;
      renderFloorsMenu();
      renderBlueprint();
      clearNavigation();
    };
    container.appendChild(btn);
  });
}

function renderBlueprint() {
  const svgCorridors = document.getElementById('corridorSvg');
  const roomsLayer = document.getElementById('roomsContainer');
  const dropdown = document.getElementById('roomDropdown');

  const currentData = campusData[selectedBldg][selectedFloor];

  svgCorridors.innerHTML = currentData.corridorsSvg;
  roomsLayer.innerHTML = '';
  dropdown.innerHTML = '<option value="">اختر القاعة...</option>';

  currentData.rooms.forEach(room => {
    const node = document.createElement('div');
    node.className = `room-node ${room.type || ''}`;
    node.id = `node-${room.id}`;
    node.innerText = room.label;

    node.style.left = room.x + 'px';
    node.style.top = room.y + 'px';
    node.style.width = room.w + 'px';
    node.style.height = room.h + 'px';

    node.onclick = () => {
      dropdown.value = room.id;
      highlightAndRoute();
    };

    roomsLayer.appendChild(node);

    const opt = document.createElement('option');
    opt.value = room.id;
    opt.innerText = room.label.replace('\n', ' ');
    dropdown.appendChild(opt);
  });

  fitToScreen();
}

function highlightAndRoute() {
  const roomId = document.getElementById('roomDropdown').value;
  const pathElem = document.getElementById('routePath');
  const marker = document.getElementById('liveMarker');
  const banner = document.getElementById('infoBanner');

  document.querySelectorAll('.room-node').forEach(n => n.classList.remove('selected'));

  if (!roomId) {
    clearNavigation();
    return;
  }

  const room = campusData[selectedBldg][selectedFloor].rooms.find(r => r.id === roomId);
  const nodeElem = document.getElementById(`node-${roomId}`);

  if (room && nodeElem) {
    nodeElem.classList.add('selected');

    const points = room.routePoints.split(' ');
    let pathD = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i]}`;
    }

    pathElem.setAttribute('d', pathD);

    const lastPoint = points[points.length - 1].split(',');
    marker.setAttribute('transform', `translate(${lastPoint[0]}, ${lastPoint[1]})`);
    marker.style.display = 'block';

    document.getElementById('infoText').innerText = `المسار المباشر نحو ${room.label.replace('\n', ' ')} (مبنى ${selectedBldg} - ${selectedFloor})`;
    banner.style.display = 'flex';
  }
}

function clearNavigation() {
  document.getElementById('roomDropdown').value = '';
  document.getElementById('routePath').setAttribute('d', '');
  document.getElementById('liveMarker').style.display = 'none';
  document.getElementById('infoBanner').style.display = 'none';
  document.querySelectorAll('.room-node').forEach(n => n.classList.remove('selected'));
}

function toggleHeader() {
  const header = document.getElementById('topControls');
  const icon = document.getElementById('toggleIcon');
  header.classList.toggle('collapsed');
  
  if (header.classList.contains('collapsed')) {
    icon.className = 'fas fa-chevron-down';
  } else {
    icon.className = 'fas fa-chevron-up';
  }
}

function openQrModal() {
  document.getElementById('qrModal').style.display = 'flex';
}

function closeQrModal() {
  document.getElementById('qrModal').style.display = 'none';
}

function testQrScan(b, fl, rm) {
  closeQrModal();
  // الباركود يحدد موقع المستخدم عند باب القاعة (إن كان pdr-nav.js محمّلاً)
  if (window.PDR && PDR.applyParams(new URLSearchParams({ from: rm }))) return;
  selectBuilding(b);
  selectedFloor = fl;
  renderFloorsMenu();
  renderBlueprint();
  
  setTimeout(() => {
    document.getElementById('roomDropdown').value = rm;
    highlightAndRoute();
  }, 100);
}
