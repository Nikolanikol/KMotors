// Перевод корейских названий авто/грейдов в латиницу.
// Портировано из telegram-bot-encar (чистые функции, без i18next — работают в API-роуте).

export const MODEL_MAP: Record<string, string> = {
  // Kia
  '쏘렌토': 'Sorento', '스포티지': 'Sportage', '카니발': 'Carnival',
  '셀토스': 'Seltos', '니로': 'Niro', '스팅어': 'Stinger',
  '레이': 'Ray', '모닝': 'Morning', 'K3': 'K3', 'K5': 'K5',
  'K8': 'K8', 'K9': 'K9', 'EV6': 'EV6', 'EV9': 'EV9', '봉고': 'Bongo',
  // Hyundai
  '아반떼': 'Avante', '쏘나타': 'Sonata', '그랜저': 'Grandeur',
  '투싼': 'Tucson', '싼타페': 'Santa Fe', '팰리세이드': 'Palisade',
  '코나': 'Kona', '넥쏘': 'Nexo', '아이오닉': 'Ioniq',
  '아이오닉5': 'Ioniq 5', '아이오닉6': 'Ioniq 6',
  '스타렉스': 'Starex', '포터': 'Porter', '베뉴': 'Venue',
  '엑센트': 'Accent', '클릭': 'Click', '아토스': 'Atos',
  '베르나': 'Verna', '트랜스폼': 'Transform',
  '갤로퍼': 'Galloper', '테라칸': 'Terracan', '투스카니': 'Tuscani',
  // Kia (older models)
  '프라이드': 'Pride', '리오': 'Rio', '쎄라토': 'Cerato',
  '포르테': 'Forte', '오피러스': 'Opirus', '카렌스': 'Carens',
  // Genesis
  'G70': 'G70', 'G80': 'G80', 'G90': 'G90',
  'GV70': 'GV70', 'GV80': 'GV80', 'GV90': 'GV90',
  // KG Mobility (SsangYong)
  '토레스': 'Torres', '렉스턴': 'Rexton', '코란도': 'Korando',
  '티볼리': 'Tivoli', '액티언': 'Actyon',
  // Renault Korea
  'QM6': 'QM6', 'SM6': 'SM6', 'XM3': 'XM3', '조에': 'Zoe',
  // Chevrolet / GM Korea
  '트레일블레이저': 'Trailblazer', '트랙스': 'Trax',
  '말리부': 'Malibu', '스파크': 'Spark', '이쿼녹스': 'Equinox',
  // Volkswagen
  '티구안': 'Tiguan', '골프': 'Golf', '파사트': 'Passat',
  '폴로': 'Polo', '아테온': 'Arteon', '투아렉': 'Touareg',
  '티록': 'T-Roc', '티크로스': 'T-Cross', '샤란': 'Sharan',
  // BMW
  '5시리즈': '5 Series', '3시리즈': '3 Series', '7시리즈': '7 Series',
  '1시리즈': '1 Series', '2시리즈': '2 Series', '4시리즈': '4 Series',
  '6시리즈': '6 Series', '8시리즈': '8 Series',
  'X1': 'X1', 'X2': 'X2', 'X3': 'X3', 'X4': 'X4',
  'X5': 'X5', 'X6': 'X6', 'X7': 'X7',
  // Mercedes (с дефисом и без — оба варианта встречаются на Encar)
  'C-클래스': 'C-Class', 'C클래스': 'C-Class',
  'E-클래스': 'E-Class', 'E클래스': 'E-Class',
  'S-클래스': 'S-Class', 'S클래스': 'S-Class',
  'A-클래스': 'A-Class', 'A클래스': 'A-Class',
  'B-클래스': 'B-Class', 'B클래스': 'B-Class',
  'G-클래스': 'G-Class', 'G클래스': 'G-Class',
  'CLA-클래스': 'CLA-Class', 'CLA클래스': 'CLA-Class',
  'CLS-클래스': 'CLS-Class', 'CLS클래스': 'CLS-Class',
  'GLA-클래스': 'GLA-Class', 'GLA클래스': 'GLA-Class',
  'GLB-클래스': 'GLB-Class', 'GLB클래스': 'GLB-Class',
  'GLC-클래스': 'GLC-Class', 'GLC클래스': 'GLC-Class',
  'GLE-클래스': 'GLE-Class', 'GLE클래스': 'GLE-Class',
  'GLS-클래스': 'GLS-Class', 'GLS클래스': 'GLS-Class',
  // Audi
  'A3': 'A3', 'A4': 'A4', 'A5': 'A5', 'A6': 'A6', 'A7': 'A7', 'A8': 'A8',
  'Q3': 'Q3', 'Q5': 'Q5', 'Q7': 'Q7', 'Q8': 'Q8',
  // Land Rover / Jaguar
  '레인지로버 이보크': 'Range Rover Evoque',
  '레인지로버 벨라': 'Range Rover Velar',
  '레인지로버 스포츠': 'Range Rover Sport',
  '레인지로버': 'Range Rover',
  '디스커버리 스포츠': 'Discovery Sport',
  '디스커버리': 'Discovery',
  'F-페이스': 'F-Pace', 'E-페이스': 'E-Pace', 'I-페이스': 'I-Pace',
  'XE': 'XE', 'XF': 'XF', 'XJ': 'XJ',
  // Volvo
  'XC40': 'XC40', 'XC60': 'XC60', 'XC90': 'XC90',
  'S60': 'S60', 'S90': 'S90', 'V60': 'V60', 'V90': 'V90',
  // Porsche
  '카이엔': 'Cayenne', '마칸': 'Macan', '파나메라': 'Panamera',
  '타이칸': 'Taycan', '카이맨': 'Cayman', '박스터': 'Boxster',
  // Toyota / Lexus
  '캠리': 'Camry', '코롤라': 'Corolla', '아발론': 'Avalon',
  '프리우스': 'Prius', '라브4': 'RAV4', '하이랜더': 'Highlander',
  'ES': 'ES', 'IS': 'IS', 'GS': 'GS', 'LS': 'LS',
  'NX': 'NX', 'RX': 'RX', 'GX': 'GX', 'LX': 'LX',
  // Honda / Nissan
  '어코드': 'Accord', '시빅': 'Civic', 'CR-V': 'CR-V', 'HR-V': 'HR-V',
  '알티마': 'Altima', '맥시마': 'Maxima', '무라노': 'Murano', '로그': 'Rogue',
  // Citroen / DS
  '그랜드 C4 스페이스투어러': 'Grand C4 Spacetourer',
  'C4 스페이스투어러': 'C4 Spacetourer',
  'C3': 'C3', 'C4': 'C4', 'C5': 'C5',
  // MINI
  '쿠퍼': 'Cooper', '클럽맨': 'Clubman', '컨트리맨': 'Countryman',
  '페이스맨': 'Paceman', '로드스터': 'Roadster',
  // Common Korean word parts in model names
  '그랜드': 'Grand', '스페이스투어러': 'Spacetourer',
};

export const MANUFACTURER_MAP: Record<string, string> = {
  '기아': 'Kia', '현대': 'Hyundai', '제네시스': 'Genesis',
  'KG모빌리티': 'KG Mobility', '쌍용': 'SsangYong',
  '르노코리아': 'Renault Korea', '르노삼성': 'Renault Korea',
  '한국GM': 'Chevrolet', '쉐보레': 'Chevrolet',
  'BMW': 'BMW', '벤츠': 'Mercedes-Benz', '메르세데스-벤츠': 'Mercedes-Benz',
  '아우디': 'Audi', '폭스바겐': 'Volkswagen', '포르쉐': 'Porsche',
  '볼보': 'Volvo', '랜드로버': 'Land Rover', '재규어': 'Jaguar',
  '토요타': 'Toyota', '렉서스': 'Lexus', '혼다': 'Honda',
  '닛산': 'Nissan', '인피니티': 'Infiniti', '미쓰비시': 'Mitsubishi',
  '시트로엥': 'Citroen', 'DS': 'DS', '푸조': 'Peugeot',
  '피아트': 'Fiat', '알파로메오': 'Alfa Romeo', '마세라티': 'Maserati',
  '페라리': 'Ferrari', '람보르기니': 'Lamborghini',
  '폴스타': 'Polestar', '테슬라': 'Tesla',
  '지프': 'Jeep', '크라이슬러': 'Chrysler', '포드': 'Ford',
  '링컨': 'Lincoln',
  '미니': 'MINI',
};

// Шаг 1: Многословные фразы — применяются на всей строке до токенизации
const GRADE_PHRASES: [string, string][] = [
  ['매뉴팩처', 'Manufaktur'],
  ['매뉴얼', 'Manual'],
  ['올 뉴', 'All New'], ['올뉴', 'All New'],
  ['더 뉴', 'The New'], ['더뉴', 'The New'],
  ['더 넥스트', 'Next'],
  ['퍼스트 에디션', 'First Edition'], ['퍼스트에디션', 'First Edition'],
  ['블랙 에디션', 'Black Edition'],   ['블랙에디션', 'Black Edition'],
  ['카본 에디션', 'Carbon Edition'],  ['카본에디션', 'Carbon Edition'],
  ['샤인 팩', 'Shine Pack'],          ['샤인팩', 'Shine Pack'],
  ['M 스포츠', 'M Sport'],            ['M스포츠', 'M Sport'],
  ['GT 라인', 'GT Line'],             ['GT라인', 'GT Line'], ['GT-라인', 'GT Line'],
  ['르 블랑', 'Le Blanc'],            ['르블랑', 'Le Blanc'],
  ['사륜구동', 'AWD'], ['전륜구동', 'FWD'], ['후륜구동', 'RWD'],
  ['가솔린+전기', 'Hybrid'], ['디젤+전기', 'Hybrid'],
];

// Шаг 2: Словарь одиночных токенов (после split по пробелам)
const GRADE_TOKEN_MAP: Record<string, string> = {
  '가솔린': 'Gasoline', '디젤': 'Diesel', '전기': 'Electric',
  '하이브리드': 'Hybrid', '수소': 'Hydrogen', 'LPG': 'LPG', 'CNG': 'CNG',
  '터보': 'Turbo', '오토': 'Auto', '수동': 'Manual',
  '뉴': 'New',
  '전륜': 'FWD', '후륜': 'RWD', '사륜': 'AWD',
  '모던': 'Modern', '프레스티지': 'Prestige', '프리미엄': 'Premium',
  '노블레스': 'Noblesse', '시그니처': 'Signature', '익스클루시브': 'Exclusive',
  '럭셔리': 'Luxury', '스마트': 'Smart', '트렌디': 'Trendy',
  '어드밴스드': 'Advanced', '컴포트': 'Comfort', '마스터': 'Master',
  '엘리트': 'Elite', '인스퍼레이션': 'Inspiration', '익스프레션': 'Expression',
  '샤인': 'Shine', '모던플러스': 'Modern Plus',
  '프리미어': 'Premier', '기본형': 'Base', '기본': 'Base',
  '엔트리': 'Entry', '베이직': 'Basic', '스탠다드': 'Standard',
  '스페셜': 'Special', '플래티넘': 'Platinum', '다이아몬드': 'Diamond',
  '팩': 'Pack', '에디션': 'Edition', '라인': 'Line',
  '플러스': 'Plus', '프로': 'Pro', '맥스': 'Max', '라이트': 'Lite',
  '캘리그래피': 'Calligraphy',
  '그래비티': 'Gravity',
  '이니셔티브': 'Initiative',
  '어반': 'Urban',
  '다이나믹': 'Dynamic',
  '오토바이오그래피': 'Autobiography',
  '컴페티션': 'Competition',
  '스포츠백': 'Sportback',
  '올로드': 'Allroad',
  '스포츠': 'Sport',
  '어드벤처': 'Adventure',
  '내추럴': 'Natural',
  '세단': 'Sedan', '해치백': 'Hatchback', '왜건': 'Wagon',
  '5도어': '5-Door', '3도어': '3-Door',
  '롱': 'Long', '숏': 'Short', '컴팩트': 'Compact',
  '세이프티': 'Safety', '테크': 'Tech',
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Переводит корейский грейд в латиницу. */
export function translateGradeText(grade: string): string {
  let result = grade;
  const sorted = [...GRADE_PHRASES].sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, translation] of sorted) {
    result = result.replace(new RegExp(escapeRegex(phrase), 'gi'), translation);
  }
  result = result
    .split(/\s+/)
    .map((token) => GRADE_TOKEN_MAP[token] ?? token)
    .filter(Boolean)
    .join(' ');
  return result.trim();
}

const KOREAN_MODIFIERS: [RegExp, string][] = [
  [/\([^)]*(?:세대|신형|F\/L)[^)]*\)/gi, ''],
  [/올\s*뉴\s*/gi, 'All New '],
  [/더\s*뉴\s*/gi, 'The New '],
  [/더\s*넥스트\s*/gi, 'Next '],
  [/뉴\s*/gi, 'New '],
  [/\s*\d+세대/gi, ''],
  [/5도어/g, '5-Door'], [/3도어/g, '3-Door'],
  [/해치백/g, 'Hatchback'], [/세단/g, 'Sedan'], [/왜건/g, 'Wagon'],
  [/컨버터블/g, 'Convertible'], [/쿠페/g, 'Coupe'],
];

/** Переводит/очищает название авто от корейских модификаторов и марок. */
export function translateModelName(raw: string): string {
  let result = raw;
  for (const [ko, en] of Object.entries(MANUFACTURER_MAP)) {
    result = result.replace(new RegExp(ko, 'g'), en);
  }
  for (const [pattern, replacement] of KOREAN_MODIFIERS) {
    result = result.replace(pattern, replacement);
  }
  const sortedModelEntries = Object.entries(MODEL_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [ko, en] of sortedModelEntries) {
    result = result.replace(new RegExp(ko, 'g'), en);
  }
  return result.replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim();
}
