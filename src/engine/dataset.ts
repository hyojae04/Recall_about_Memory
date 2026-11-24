import type { BenchmarkCase, Conversation } from './types';

export const DATASET_VERSION = 'recall-ko-synthetic-1.0';

// Eight authored conversation families. Six probes per family are correlated;
// this is a transparent diagnostic fixture, not a representative population.
const profiles = [
  {
    id: 'mina',
    name: '민아',
    initials: 'M',
    color: '#f3ddd1',
    topic: '음료',
    old: '아이스 아메리카노',
    next: '따뜻한 루이보스차',
    change: '카페인을 줄이기로 했어',
    place: '성수동 디자인 스튜디오',
    pet: '고양이 모카',
    hobby: '필름 사진',
    project: '브랜드 리뉴얼',
    paraphrase: '카페에서 뭘 주문해 주면 좋을까?',
    unknown: '내 여권 번호는 뭐야?',
  },
  {
    id: 'jun',
    name: '준서',
    initials: 'J',
    color: '#dfe6f5',
    topic: '운동',
    old: '저녁 달리기',
    next: '아침 수영',
    change: '무릎에 부담을 줄이려고 해',
    place: '판교 게임 스튜디오',
    pet: '강아지 두부',
    hobby: '보드게임',
    project: '게임 튜토리얼',
    paraphrase: '몸을 움직이는 활동 중 뭘 좋아하지?',
    unknown: '내 반려동물은 몇 살이야?',
  },
  {
    id: 'sora',
    name: '소라',
    initials: 'S',
    color: '#e5dff2',
    topic: '여행지',
    old: '부산',
    next: '강릉',
    change: '조용한 동해 바다가 보고 싶어',
    place: '을지로 출판사',
    pet: '고양이 밤이',
    hobby: '수채화',
    project: '독립 잡지',
    paraphrase: '이번 휴가에는 어느 도시로 떠나지?',
    unknown: '내 생일은 언제야?',
  },
  {
    id: 'leo',
    name: '도윤',
    initials: 'D',
    color: '#dcebe0',
    topic: '개발 언어',
    old: 'JavaScript',
    next: 'TypeScript',
    change: '타입 오류를 미리 잡고 싶어',
    place: '역삼동 스타트업',
    pet: '강아지 콩이',
    hobby: '기타 연주',
    project: '예약 서비스',
    paraphrase: '요즘 코드는 어떤 걸로 작성해?',
    unknown: '내 회사 연봉은 얼마야?',
  },
  {
    id: 'yuna',
    name: '유나',
    initials: 'Y',
    color: '#f4e8cb',
    topic: '음악',
    old: '인디 록',
    next: '재즈 피아노',
    change: '차분하게 집중하고 싶어',
    place: '연남동 건축사무소',
    pet: '고양이 레오',
    hobby: '도예',
    project: '작은 도서관',
    paraphrase: '이어폰으로 즐겨 듣는 장르는 뭐지?',
    unknown: '내 자동차 번호는 뭐야?',
  },
  {
    id: 'haon',
    name: '하온',
    initials: 'H',
    color: '#f0dfe7',
    topic: '아침 메뉴',
    old: '토스트',
    next: '오트밀',
    change: '아침을 좀 더 가볍게 먹으려고 해',
    place: '광화문 연구소',
    pet: '강아지 구름',
    hobby: '등산',
    project: '도시 데이터 분석',
    paraphrase: '기상하고 나서 첫 끼로 뭘 먹어?',
    unknown: '내 반려동물의 몸무게는 얼마야?',
  },
  {
    id: 'ian',
    name: '이안',
    initials: 'I',
    color: '#dee9ec',
    topic: '이동 수단',
    old: '자동차',
    next: '자전거',
    change: '짧은 거리는 직접 움직이려고 해',
    place: '합정 영상 제작사',
    pet: '고양이 먼지',
    hobby: '베이킹',
    project: '다큐멘터리 편집',
    paraphrase: '집에서 사무실까지 뭘 타고 가?',
    unknown: '내 신발 사이즈는 얼마야?',
  },
  {
    id: 'seo',
    name: '서진',
    initials: 'S',
    color: '#e8e5da',
    topic: '독서 장르',
    old: '추리 소설',
    next: '과학 에세이',
    change: '새로운 지식을 배우는 게 재밌어',
    place: '마포 교육 회사',
    pet: '강아지 호두',
    hobby: '클라이밍',
    project: '온라인 강의',
    paraphrase: '책장에 요즘 어떤 종류의 책을 꽂아?',
    unknown: '내 회사 대표의 이름은 뭐야?',
  },
];

// The Latin language names in this fixture both end in "트" when read in Korean.
function particle(word: string, consonant: string, vowel: string): string {
  const last = word.charCodeAt(word.length - 1);
  const hasFinal = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return word + (hasFinal ? consonant : vowel);
}

export const conversations: Conversation[] = profiles.map((p, profileIndex) => {
  const texts: Array<[number, number, string, number?]> = [
    [
      1,
      1,
      `내가 선호하는 ${particle(p.topic, '은', '는')} ${particle(p.old, '이야', '야')}. ${p.topic} 취향을 기억해 줘.`,
    ],
    [2, 1, `내 직장은 ${particle(p.place, '이야', '야')}. 여기에서 일하고 있어.`],
    [3, 1, '이번 주말에는 친구들이랑 공원에서 산책했어. 날씨가 정말 좋았어.'],
    [4, 2, `우리 반려동물은 ${particle(p.pet, '이야', '야')}. 이름을 꼭 기억해 줘.`],
    [5, 2, `진행하는 프로젝트는 ${particle(p.project, '이야', '야')}. 다음 달까지 끝낼 예정이야.`],
    [6, 2, '어제 장을 보러 갔다가 예쁜 머그컵을 발견했어. 다음에 다시 가 보려고.'],
    [
      8,
      3,
      `${p.topic} 취향이 바뀌었어. 이제 ${particle(p.next, '을', '를')} 좋아해. ${p.change}.`,
      1,
    ],
    [9, 3, '회의는 수요일 오후 세 시로 잡혔어. 발표 자료를 준비해야 해.'],
    [10, 3, '주말에 들렀던 전시가 마음에 들었어. 엽서도 몇 장 샀어.'],
    [11, 4, `요즘 취미로 ${particle(p.hobby, '을', '를')} 시작했어. 새로운 걸 배우는 게 즐거워.`],
    [12, 4, '오늘은 비가 많이 와서 집에서 쉬었어. 창밖을 보니 가을이 온 것 같아.'],
    [13, 4, '내일은 책상을 정리하고 밀린 이메일에 답장하려고 해.'],
  ];
  return {
    id: p.id,
    name: p.name,
    initials: p.initials,
    color: p.color,
    subtitle: `${p.topic} 취향이 바뀐 4번의 대화`,
    memories: texts
      .map(([day, session, text, supersedes], i) => ({
        id: `${p.id}-${i + 1}`,
        text,
        // Half the updates are recent, half fall outside the recent K=3 window.
        timestamp:
          supersedes && profileIndex % 2
            ? '2026-10-13T10:00:00Z'
            : `2026-10-${String(day).padStart(2, '0')}T09:00:00Z`,
        session: supersedes && profileIndex % 2 ? 4 : session,
        ...(supersedes ? { supersedes: `${p.id}-${supersedes}` } : {}),
      }))
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)),
  };
});

export const benchmarkCases: BenchmarkCase[] = profiles.flatMap((p) => [
  {
    id: `${p.id}-update`,
    conversationId: p.id,
    category: 'update' as const,
    query: `지금 선호하는 ${particle(p.topic, '은', '는')} 뭐야?`,
    evidenceIds: [`${p.id}-7`],
    reference: p.next,
    explanation:
      '후속 대화에서 취향을 명시적으로 바꿨습니다. 최초 취향은 현재 질문의 근거로 사용할 수 없습니다.',
  },
  {
    id: `${p.id}-recall`,
    conversationId: p.id,
    category: 'recall' as const,
    query: '내 직장은 어디야?',
    evidenceIds: [`${p.id}-2`],
    reference: p.place,
    explanation: '첫 번째 대화에서 한 번 언급한 직장을 다시 찾아야 합니다.',
  },
  {
    id: `${p.id}-multi`,
    conversationId: p.id,
    category: 'multi' as const,
    query: '내 직장과 반려동물 이름을 알려줘.',
    evidenceIds: [`${p.id}-2`, `${p.id}-4`],
    reference: `${p.place} · ${p.pet}`,
    explanation: '서로 다른 세션에 있는 직장과 반려동물, 두 근거가 모두 필요합니다.',
  },
  {
    id: `${p.id}-temporal`,
    conversationId: p.id,
    category: 'temporal' as const,
    query: `그때 선호하는 ${particle(p.topic, '은', '는')} 뭐였어?`,
    asOf: '2026-10-06T23:59:59Z',
    evidenceIds: [`${p.id}-1`],
    reference: p.old,
    explanation: '조회 시점은 10월 6일입니다. 이후 대화의 정정은 아직 발생하지 않았습니다.',
  },
  {
    id: `${p.id}-abstention`,
    conversationId: p.id,
    category: 'abstention' as const,
    query: p.unknown,
    evidenceIds: [],
    reference: '기억에 근거가 없습니다.',
    explanation:
      '정답 정보가 기록되어 있지 않습니다. 관련 단어가 있어도 정답 근거가 된다는 뜻은 아닙니다.',
  },
  {
    id: `${p.id}-paraphrase`,
    conversationId: p.id,
    category: 'paraphrase' as const,
    query: p.paraphrase,
    evidenceIds: [`${p.id}-7`],
    reference: p.next,
    explanation:
      '질문의 표현과 기억의 표현이 다릅니다. 어휘 검색의 한계를 확인하기 위한 사례입니다.',
  },
]);

export const getConversation = (id: string) => {
  const found = conversations.find((conversation) => conversation.id === id);
  if (!found) throw new Error(`Unknown conversation: ${id}`);
  return found;
};
