// Uganda-specific options used on the registration form and in admin reports.

export const currentClasses = [
  { group: "Primary", options: ["P6", "P7"] },
  { group: "Secondary", options: ["S1", "S2", "S3", "S4", "S5", "S6"] },
  { group: "Finished school", options: ["Completed S4 (UCE)", "Completed S6 (UACE)"] },
  { group: "Tertiary / University", options: ["Certificate", "Diploma", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Graduate"] },
  { group: "Other", options: ["Other"] },
] as const;

export const allClasses: string[] = currentClasses.flatMap((g) => [...g.options]);

export const genders = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const heardFromOptions = [
  "WhatsApp", "Facebook", "TikTok", "Instagram", "X (Twitter)", "YouTube", "Radio", "TV",
  "School / teacher", "Friend or family", "Church, mosque or community group", "Poster or flyer", "Google search", "Other",
] as const;

/** Suggestions only: students can still type a district that is not listed. */
export const ugandaDistricts = [
  "Abim", "Adjumani", "Agago", "Alebtong", "Amolatar", "Amudat", "Amuria", "Amuru", "Apac", "Arua", "Budaka", "Bududa",
  "Bugiri", "Bugweri", "Buhweju", "Buikwe", "Bukedea", "Bukomansimbi", "Bukwo", "Bulambuli", "Buliisa", "Bundibugyo",
  "Bunyangabu", "Bushenyi", "Busia", "Butaleja", "Butambala", "Butebo", "Buvuma", "Buyende", "Dokolo", "Gomba", "Gulu",
  "Hoima", "Ibanda", "Iganga", "Isingiro", "Jinja", "Kaabong", "Kabale", "Kabarole", "Kaberamaido", "Kagadi", "Kakumiro",
  "Kalaki", "Kalangala", "Kaliro", "Kalungu", "Kampala", "Kamuli", "Kamwenge", "Kanungu", "Kapchorwa", "Kapelebyong",
  "Karenga", "Kasese", "Kasanda", "Katakwi", "Kayunga", "Kazo", "Kibaale", "Kiboga", "Kibuku", "Kikuube", "Kiruhura",
  "Kiryandongo", "Kisoro", "Kitagwenda", "Kitgum", "Koboko", "Kole", "Kotido", "Kumi", "Kwania", "Kween", "Kyankwanzi",
  "Kyegegwa", "Kyenjojo", "Kyotera", "Lamwo", "Lira", "Luuka", "Luwero", "Lwengo", "Lyantonde", "Madi-Okollo", "Manafwa",
  "Maracha", "Masaka", "Masindi", "Mayuge", "Mbale", "Mbarara", "Mitooma", "Mityana", "Moroto", "Moyo", "Mpigi", "Mubende",
  "Mukono", "Nabilatuk", "Nakapiripirit", "Nakaseke", "Nakasongola", "Namayingo", "Namisindwa", "Namutumba", "Napak",
  "Nebbi", "Ngora", "Ntoroko", "Ntungamo", "Nwoya", "Obongi", "Omoro", "Otuke", "Oyam", "Pader", "Pakwach", "Pallisa",
  "Rakai", "Rubanda", "Rubirizi", "Rukiga", "Rukungiri", "Rwampara", "Sembabule", "Serere", "Sheema", "Sironko", "Soroti",
  "Terego", "Tororo", "Wakiso", "Yumbe", "Zombo", "Outside Uganda",
];
