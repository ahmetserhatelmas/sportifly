export const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
  'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop', 'Şırnak', 'Sivas', 'Tekirdağ',
  'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
];

const DISTRICTS: Record<string, string[]> = {
  İstanbul: [
    'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy',
    'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece',
    'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa',
    'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik',
    'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli',
    'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu',
  ],
  Ankara: [
    'Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çankaya', 'Çubuk', 'Elmadağ',
    'Etimesgut', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören',
    'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar',
    'Yenimahalle',
  ],
  İzmir: [
    'Aliağa', 'Balçova', 'Bayraklı', 'Bergama', 'Bornova', 'Buca', 'Çeşme', 'Çiğli',
    'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karşıyaka', 'Kemalpaşa', 'Konak',
    'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Torbalı', 'Urla',
  ],
  Bursa: [
    'Gemlik', 'Gürsu', 'İnegöl', 'Kestel', 'Mudanya', 'Mustafakemalpaşa', 'Nilüfer',
    'Orhangazi', 'Osmangazi', 'Yıldırım',
  ],
  Antalya: [
    'Aksu', 'Alanya', 'Döşemealtı', 'Kaş', 'Kemer', 'Kepez', 'Konyaaltı', 'Manavgat',
    'Muratpaşa', 'Serik', 'Side',
  ],
  Adana: ['Ceyhan', 'Çukurova', 'Kozan', 'Sarıçam', 'Seyhan', 'Yüreğir'],
  Kocaeli: ['Başiskele', 'Çayırova', 'Darıca', 'Derince', 'Gebze', 'Gölcük', 'İzmit', 'Körfez'],
  Konya: ['Beyşehir', 'Ereğli', 'Karatay', 'Meram', 'Selçuklu'],
  Gaziantep: ['Nizip', 'Oğuzeli', 'Şahinbey', 'Şehitkamil'],
  Mersin: ['Akdeniz', 'Erdemli', 'Mezitli', 'Tarsus', 'Toroslar', 'Yenişehir'],
  Kayseri: ['Develi', 'Kocasinan', 'Melikgazi', 'Talas'],
  Eskişehir: ['Odunpazarı', 'Tepebaşı'],
  Samsun: ['Atakum', 'Bafra', 'Canik', 'İlkadım', 'Tekkeköy'],
  Trabzon: ['Akçaabat', 'Araklı', 'Of', 'Ortahisar', 'Yomra'],
};

export function getDistricts(city: string): string[] {
  return DISTRICTS[city] ?? ['Merkez'];
}
