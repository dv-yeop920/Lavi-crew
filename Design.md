# Wanted Design System — Frontend Implementation Guide

> 이 문서는 제공된 `Wanted Design System (Community)` 이미지 내 디자인 규칙을 분석해, 프론트엔드와 AI 코딩 에이전트가 일관된 UI를 구현할 수 있도록 정리한 구현 기준이다.
>
> 원본 파일에는 일부 화면 이미지와 에셋만 포함되어 있어 모든 토큰의 실제 HEX 값, 전체 타이포그래피 수치, 모든 컴포넌트 속성을 확인할 수는 없다. 확인되지 않은 값은 임의로 생성하지 않는다.

---

## 1. Design System Overview

이 디자인 시스템은 다음 구조를 따른다.

- **Atomic token**: 실제 색상값을 가진 원시 토큰
- **Semantic token**: 역할과 사용 목적을 나타내며 Atomic token을 참조
- **Typography hierarchy**: 7단계 위계와 총 18개의 하위 스타일
- **Component variants**: 플랫폼, 상태, 형태를 Figma Variant 속성으로 구분
- **Light / Dark theme**: 동일한 의미의 Semantic token이 테마별 Atomic token을 참조
- **Multi-platform**: Web, Android, iOS 환경을 함께 고려

구현 시 화면에서 직접 색상값이나 크기를 지정하기보다 **Semantic token → Atomic token** 순서로 참조한다.

---

## 2. Source of Truth

디자인과 코드가 충돌할 경우 다음 우선순위를 따른다.

1. 승인된 Figma 컴포넌트와 Variables
2. 이 문서의 규칙
3. 프로젝트의 공통 UI 컴포넌트
4. 개별 페이지 스타일

원본 Figma에 없는 상태나 스타일을 개발자가 임의로 추가하지 않는다.

---

## 3. Design Token Architecture

### 3.1 Token layers

토큰은 두 계층으로 분리한다.

```text
Semantic Token
    ↓ references
Atomic Token
    ↓ resolves to
Concrete value
```

예시:

```text
color-semantic-primary-normal
    → color-atomic-blue-60
    → actual color value
```

컴포넌트에서는 Atomic token이 아니라 Semantic token을 사용한다.

```css
/* 권장 */
.button {
  background-color: var(--color-semantic-primary-normal);
}

/* 금지 */
.button {
  background-color: var(--color-atomic-blue-60);
}

/* 금지 */
.button {
  background-color: #0066ff;
}
```

Atomic token은 토큰 정의 파일 내부에서만 직접 사용한다.

---

## 4. Color Tokens

### 4.1 Confirmed semantic tokens

제공된 디자인 자료에서 다음 Semantic token 이름을 확인할 수 있다.

| Category | Semantic token | Referenced atomic token | Intended role |
|---|---|---|---|
| Static | `color-semantic-static-white` | `color-atomic-common-100` | 테마와 관계없이 유지되는 흰색 |
| Static | `color-semantic-static-black` | `color-atomic-common-0` | 테마와 관계없이 유지되는 검은색 |
| Primary | `color-semantic-primary-normal` | `color-atomic-blue-60` | 기본 브랜드 액션 |
| Primary | `color-semantic-primary-strong` | `color-atomic-blue-55` | 강조 또는 상호작용 상태 |
| Primary | `color-semantic-primary-heavy` | `color-atomic-blue-50` | 가장 강한 브랜드 강조 |
| Label | `color-semantic-label-normal` | `color-atomic-coolNeutral-99`* | 기본 텍스트 |
| Label | `color-semantic-label-strong` | `color-atomic-common-100`* | 가장 강한 텍스트 |
| Label | `color-semantic-label-neutral` | `color-atomic-coolNeutral-90`* | 중립적인 보조 텍스트 |

`*` Label 참조값은 제공 이미지의 다크 테마 영역에서 확인된 값이다. 라이트 테마에서는 동일한 Semantic token이 다른 Atomic token을 참조할 수 있다.

### 4.2 Theme behavior

Light / Dark theme에서 Semantic token 이름은 유지하고 참조값만 변경한다.

```css
:root,
[data-theme='light'] {
  --color-semantic-label-normal: var(--color-atomic-cool-neutral-light-value);
  --color-semantic-background-normal: var(--color-atomic-common-100);
}

[data-theme='dark'] {
  --color-semantic-label-normal: var(--color-atomic-cool-neutral-99);
  --color-semantic-background-normal: var(--color-atomic-common-0);
}
```

> 실제 라이트 테마 참조값은 원본 Figma Variables 확인 후 입력한다.

### 4.3 Naming convention

CSS에서는 Figma 토큰 이름을 가능한 한 그대로 유지한다.

```text
Figma: color-semantic-primary-normal
CSS:   --color-semantic-primary-normal
TS:    color.semantic.primary.normal
```

권장 토큰 파일:

```text
shared/styles/tokens/
├── color.atomic.css
├── color.semantic.css
├── typography.css
├── theme.light.css
├── theme.dark.css
└── index.css
```

---

## 5. Typography

### 5.1 Font family

기본 글꼴은 **Pretendard JP**를 사용한다.

지원 언어:

- 한국어
- 영어
- 일본어

권장 Font stack:

```css
:root {
  --font-family-base:
    'Pretendard JP',
    'Pretendard',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

html,
body {
  font-family: var(--font-family-base);
}
```

### 5.2 Hierarchy

제공된 디자인 문서에는 다음 구조가 명시되어 있다.

- 총 **7단계 위계**
- 총 **18개의 하위 위계**

다만 각 스타일의 정확한 이름, 크기, 굵기, 행간은 이미지에 포함되어 있지 않으므로 임의로 만들지 않는다.

Figma에서 수치를 확인한 뒤 다음 형식으로 기록한다.

| Typography token | Font size | Weight | Line height | Letter spacing | Usage |
|---|---:|---:|---:|---:|---|
| `display-*` | TBD | TBD | TBD | TBD | 대형 프로모션 문구 |
| `title-*` | TBD | TBD | TBD | TBD | 페이지 및 섹션 제목 |
| `heading-*` | TBD | TBD | TBD | TBD | 콘텐츠 제목 |
| `body-*` | TBD | TBD | TBD | TBD | 본문 |
| `label-*` | TBD | TBD | TBD | TBD | 버튼, 탭, 입력 라벨 |
| `caption-*` | TBD | TBD | TBD | TBD | 보조 설명 |
| `number-*` | TBD | TBD | TBD | TBD | 숫자 강조 |

### 5.3 Typography rules

- 임의의 `font-size`를 페이지 단위로 추가하지 않는다.
- 텍스트 위계는 크기뿐 아니라 굵기, 행간, 색상을 함께 적용한다.
- 버튼 텍스트와 본문 텍스트를 같은 스타일로 재사용하지 않는다.
- 텍스트 잘림은 무조건 `ellipsis`로 해결하지 않고 컴포넌트 정책을 먼저 확인한다.
- 한국어·영어·일본어 혼합 환경에서 줄 높이와 baseline을 확인한다.

---

## 6. Themes

제공된 예시 화면은 동일한 콘텐츠가 Light / Dark theme에서 전환되는 구조를 보여준다.

### 6.1 Principles

- 테마 분기는 컴포넌트 내부 조건문보다 CSS Variable로 처리한다.
- Dark theme에서 단순 색상 반전만 하지 않는다.
- 카드 이미지, 일러스트, 배지, 아이콘의 가독성을 별도로 확인한다.
- `static-white`, `static-black`은 테마가 바뀌어도 값이 유지된다.
- 텍스트, 배경, 선, 아이콘에는 Semantic token을 적용한다.

### 6.2 Recommended implementation

```tsx
<html data-theme={theme}>
```

```css
.card {
  color: var(--color-semantic-label-normal);
  background: var(--color-semantic-background-normal);
  border-color: var(--color-semantic-line-normal);
}
```

---

## 7. Navigation Components

Navigation은 사용자가 페이지나 주요 섹션 사이를 이동할 수 있게 하는 요소다.

확인된 주요 컴포넌트:

- `Top Navigation`
- `Bottom Navigation`

### 7.1 Top Navigation

화면 상단에 배치하며 큰 화면 또는 페이지 Header에서 사용한다.

확인된 Variant 속성:

```text
platform = ios | android | web
variant  = normal | default | extended | floating
```

이미지에서는 `normal`과 `default`가 각각 별도 값인지, 문서 표기상 묶인 표현인지 명확하지 않다. 원본 Figma Variant property를 확인해 최종 enum을 확정한다.

확인된 구성 요소:

- Leading navigation action
- Page title
- Trailing action
- 플랫폼별 status bar 또는 상단 여백
- Extended layout에서 보조/대형 제목 영역
- Floating layout에서 콘텐츠와 분리된 컨테이너

권장 React API:

```tsx
<TopNavigation
  platform="web"
  variant="default"
  title="제목"
  leading={<BackButton />}
  trailing={<ActionButton />}
/>
```

구현 규칙:

- 뒤로가기는 아이콘 모양이 아니라 실제 navigation history와 연결한다.
- `leading`, `title`, `trailing` 영역의 정렬을 임의의 margin으로 맞추지 않는다.
- 제목이 길어질 때의 줄바꿈/말줄임 정책을 Variant별로 정의한다.
- Web과 Native 레이아웃을 하나의 DOM에 과도하게 억지로 통합하지 않는다.
- Floating Variant는 주변 배경과 구분되는 surface token을 사용한다.

### 7.2 Bottom Navigation

화면 하단에 위치하며 작은 화면의 주요 목적지 이동에 사용한다.

확인된 Variant 속성:

```text
platform = ios | android | web
status   = logout | login
scroll   = auto
```

확인된 항목 예시:

- 채용
- 커리어
- 소셜
- MY 원티드
- 전체

권장 React API:

```tsx
<BottomNavigation
  platform="web"
  authStatus="login"
  scrollBehavior="auto"
  activeItem="jobs"
  items={items}
/>
```

구현 규칙:

- 현재 활성 항목은 아이콘 색상만으로 구분하지 않는다.
- 인증 상태에 따라 노출 항목 또는 목적지가 달라질 수 있다.
- 모바일 safe area를 고려한다.
- Bottom Navigation 위로 콘텐츠가 가려지지 않도록 페이지 하단 여백을 확보한다.
- 화면의 모든 메뉴를 넣지 않고 최상위 목적지만 배치한다.
- 아이콘과 라벨을 함께 제공한다.

---

## 8. Icons and Assets

압축 파일에는 Shortcut 용 아이콘 에셋이 1x, 2x, 3x 배율로 포함되어 있다.

```text
Section/Job/Icon/Shortcut/
├── ...png
├── ...@2x.png
└── ...@3x.png
```

### Rules

- Web에서는 가능하면 SVG 또는 단일 고해상도 에셋을 사용한다.
- Native 환경에서는 기기 pixel density에 맞는 배율을 사용한다.
- 같은 의미의 아이콘을 화면마다 다르게 만들지 않는다.
- 클릭 가능한 아이콘은 버튼으로 구현한다.
- 아이콘 전용 버튼에는 접근 가능한 이름을 제공한다.
- 장식용 이미지는 스크린 리더에서 제외한다.

```tsx
<button type="button" aria-label="뒤로 가기">
  <BackIcon aria-hidden="true" />
</button>
```

---

## 9. Component API Principles

Figma Variant는 React props와 일관되게 연결한다.

```text
Figma property → React prop
platform       → platform
variant        → variant
status         → status / authStatus
scroll         → scrollBehavior
state          → state or native HTML state
```

### Rules

- 문자열 Variant는 union type으로 제한한다.
- 디자인에 없는 자유 입력값을 props로 허용하지 않는다.
- 색상, padding, radius를 호출부에서 직접 전달하지 않는다.
- `disabled`, `aria-*`, `type`처럼 HTML 표준 속성을 우선 활용한다.

```ts
type TopNavigationVariant = 'default' | 'extended' | 'floating';
type Platform = 'web' | 'ios' | 'android';

type TopNavigationProps = {
  platform: Platform;
  variant?: TopNavigationVariant;
  title: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};
```

---

## 10. Layout and Responsive Behavior

제공된 자료는 Web, iOS, Android를 함께 다루지만 정확한 breakpoint 값은 확인되지 않는다.

따라서 다음 원칙만 적용하고 실제 수치는 프로젝트 또는 Figma에서 확정한다.

- Web은 넓은 화면에서 Top Navigation을 우선 사용한다.
- 작은 화면에서는 Bottom Navigation 사용을 검토한다.
- 플랫폼 전환을 단순 viewport width만으로 결정하지 않는다.
- 고정 Navigation 사용 시 콘텐츠 영역에 높이만큼 padding을 확보한다.
- iOS safe-area inset을 고려한다.
- 카드 목록은 Light / Dark theme에서 동일한 정보 위계를 유지한다.

```css
.bottom-navigation {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 11. Accessibility

- 모든 인터랙션 요소는 키보드로 접근할 수 있어야 한다.
- Focus 표시를 제거하지 않는다.
- 아이콘 버튼에는 `aria-label`을 제공한다.
- Navigation은 적절한 `nav` landmark를 사용한다.
- 현재 페이지 항목에는 `aria-current="page"`를 제공한다.
- 색상만으로 상태를 전달하지 않는다.
- Light / Dark theme 모두 텍스트 대비를 확인한다.
- 터치 영역은 시각적 아이콘 크기보다 충분히 크게 확보한다.

```tsx
<nav aria-label="주요 메뉴">
  <a href="/jobs" aria-current="page">
    채용
  </a>
</nav>
```

---

## 12. FSD Placement

현재 프로젝트의 FSD 규칙에 맞춰 다음처럼 배치한다.

```text
src/
├── app/
│   └── styles/
│       └── globals.css
├── widgets/
│   ├── top-navigation/
│   └── bottom-navigation/
├── shared/
│   ├── ui/
│   │   ├── icon-button/
│   │   ├── navigation-item/
│   │   └── badge/
│   ├── assets/
│   │   └── icons/
│   └── styles/
│       ├── tokens/
│       │   ├── color.atomic.css
│       │   ├── color.semantic.css
│       │   ├── typography.css
│       │   ├── theme.light.css
│       │   └── theme.dark.css
│       └── index.css
```

분류 기준:

- 순수 토큰과 원자 UI는 `shared`
- 페이지 전체에 사용되는 Top/Bottom Navigation 조합은 `widgets`
- 로그인 여부에 따라 메뉴 동작을 바꾸는 로직은 관련 `feature`로 분리 가능
- 공고, 사용자, 커리어 같은 도메인 데이터가 들어간 UI는 `entities`

---

## 13. Implementation Rules for AI Agents

AI 코딩 에이전트는 다음 규칙을 반드시 따른다.

### Must

- 기존 Semantic token을 먼저 검색한다.
- Figma Variant 이름을 컴포넌트 prop에 반영한다.
- Light / Dark theme 모두 고려한다.
- 기존 Navigation 컴포넌트를 재사용한다.
- 플랫폼 차이는 명시적인 prop 또는 adapter로 처리한다.
- 접근성 속성을 포함한다.
- 확인할 수 없는 디자인 값은 TODO로 남긴다.

### Must not

- 이미지에서 비슷해 보인다는 이유로 HEX 값을 추측하지 않는다.
- 페이지 파일에 임의의 색상과 글자 크기를 추가하지 않는다.
- Figma에 없는 Variant를 임의로 만들지 않는다.
- 동일한 UI를 페이지마다 중복 구현하지 않는다.
- Dark theme를 단순 `filter: invert()`로 구현하지 않는다.
- Web용 Navigation에 모바일 status bar를 그대로 포함하지 않는다.

---

## 14. Review Checklist

### Token

- [ ] 컴포넌트에서 Semantic token을 사용했는가?
- [ ] Atomic token을 화면에서 직접 참조하지 않았는가?
- [ ] Light / Dark theme에서 올바르게 전환되는가?
- [ ] 임의의 HEX 값이 없는가?

### Typography

- [ ] Pretendard JP가 적용되었는가?
- [ ] 정의된 Text style만 사용했는가?
- [ ] 한국어·영어·일본어에서 레이아웃이 안정적인가?

### Navigation

- [ ] 플랫폼별 Variant가 올바른가?
- [ ] 현재 위치가 시각적·의미적으로 표현되는가?
- [ ] 인증 상태에 맞는 메뉴가 노출되는가?
- [ ] 하단 Navigation이 콘텐츠를 가리지 않는가?
- [ ] Safe area를 고려했는가?

### Accessibility

- [ ] Icon button에 접근 가능한 이름이 있는가?
- [ ] Keyboard focus가 보이는가?
- [ ] `nav`, `aria-current` 등을 적용했는가?
- [ ] 색상 외의 상태 표현이 있는가?

---

## 15. Information Missing from the Export

현재 압축 파일만으로는 다음 항목을 확정할 수 없다.

- 전체 Atomic color 값과 HEX/RGB 수치
- 전체 Semantic token 목록
- Light theme의 Label token 참조값
- 18개 Typography style의 정확한 이름과 수치
- Spacing scale
- Radius scale
- Shadow / elevation token
- Breakpoint 값
- Grid 및 container 기준
- Top / Bottom Navigation의 전체 Variant 조합
- 컴포넌트별 interaction state

이 값들은 Figma 원본 Variables 및 Component property를 확인한 뒤 이 문서에 추가해야 한다.

---

## 16. Recommended Next Synchronization Format

Figma에서 전체 값을 추출할 수 있다면 아래 산출물을 함께 관리한다.

```text
docs/
└── Design.md

src/shared/styles/tokens/
├── tokens.json
├── color.atomic.css
├── color.semantic.css
├── typography.css
├── theme.light.css
└── theme.dark.css
```

권장 원본 데이터 구조:

```json
{
  "color": {
    "atomic": {
      "blue": {
        "60": "TBD"
      }
    },
    "semantic": {
      "primary": {
        "normal": "{color.atomic.blue.60}"
      }
    }
  }
}
```

토큰 변경은 Figma → token data → CSS Variables → components 순서로 반영한다.

---

## 17. Lavi Crew Confirmed Theme

사용자 승인에 따라 라비크루 MVP는 흰 배경의 Light theme를 기본이자 유일한 테마로 사용한다.

### 17.1 Primary palette

| Token | Value | Usage |
|---|---:|---|
| `purple-900` | `#2A0049` | pressed, 가장 강한 강조 |
| `purple-800` | `#3A0065` | hover, strong text |
| `purple-700` | `#4B0082` | primary brand color |
| `purple-600` | `#622398` | 보조 강조 |
| `purple-500` | `#7A46A8` | 아이콘·그래프 보조색 |
| `purple-300` | `#B592CB` | 강조 테두리 |
| `purple-100` | `#EEE6F4` | 선택·강조 배경 |
| `purple-50` | `#F8F5FA` | 가장 옅은 surface |
| `blue-700` | `#1D4ED8` | 달력의 토요일 텍스트 |
| `red-700` | `#B42318` | 달력의 일요일 텍스트 |

- 페이지 배경과 기본 카드는 `#FFFFFF`를 사용한다.
- 컴포넌트는 위 값을 직접 사용하지 않고 `color-semantic-*` 토큰을 참조한다.
- `color-semantic-primary-muted`는 `purple-600`을 참조하며 Primary보다 한 단계 옅은 강조 테두리에 사용한다.
- 인원 상세의 가능한 포지션은 개별 체크 항목이 아니라 그룹 전체를 감싸는 외곽선에 `color-semantic-primary-muted`를 적용한다.
- Dark theme는 별도 사용자 결정 전까지 제공하지 않는다.
- 월간 달력은 토요일을 `color-semantic-weekend-saturday`, 일요일을 `color-semantic-weekend-sunday`로 구분한다. 선택 상태처럼 배경 대비가 우선인 상태에서는 `color-semantic-on-primary`를 사용한다.
- 월간 달력의 날짜 셀은 테두리 없이 표현하며, 선택·등록 상태는 배경색과 글자색으로 구분한다.
- 스케줄 인원 배정 테이블은 `34rem` 이하에서 행마다 세로 카드로 전환한다. 포지션명은 카드 상단 전체 폭, 인원 셀렉트·이력·추가 및 삭제 액션은 그 아래 전체 폭에 배치하며 페이지 가로 스크롤을 만들지 않는다.

### 17.2 Typography system

기본 글꼴은 Pretendard JP이며 없을 경우 Pretendard와 운영체제 기본 sans-serif로 대체한다.

| Hierarchy | Styles |
|---|---|
| Display | `display` 40px |
| Title | `title-large` 32px · `title-medium` 28px · `title-small` 24px |
| Heading | `heading-large` 22px · `heading-medium` 20px · `heading-small` 18px |
| Body | `body-large` 16px · `body-medium` 15px · `body-small` 14px |
| Label | `label-large` 15px · `label-medium` 14px · `label-small` 12px |
| Caption | `caption-large` 13px · `caption-small` 12px |
| Number | `number-large` 32px · `number-medium` 24px · `number-small` 16px |

- 제목은 1.25, 본문은 1.5~1.6 line-height를 사용한다.
- 제목과 큰 숫자는 `-0.02em`, 본문과 라벨은 기본 자간을 사용한다.
- 페이지와 컴포넌트에서 임의의 `font-size`를 추가하지 않는다.
