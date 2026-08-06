# 013. View와 Hook 분리

## 상태

확정 (2026-08-04)

## 배경

View가 표시만 담당해야 한다는 규칙(AGENTS.md 5절)이 있음에도, 로컬 상태·파생 계산·이벤트 핸들러·브라우저 전용 API 접근이 JSX와 함께 View 파일에 쌓이는 사례가 늘고 있다. 예를 들어 `features/schedule/views/admin-schedule-registration-view.tsx`는 데모 오버레이 저장을 위해 여러 `useMemo`/`useEffect`와 포지션·근무자 조회를 포함한 데이터 조립 로직을 컴포넌트 본문에 직접 담고 있어 600줄을 넘는다. `features/schedule/hooks/use-demo-schedule-overlay.ts`처럼 이미 비공식적으로 커스텀 훅을 쓰는 선례가 있지만 문서화된 규칙은 없었다.

## 결정

- `features/<feature>/hooks/`를 VAC 디렉터리 구조에 정식으로 추가한다.
- View는 JSX 조합과 레이아웃만 담당한다. 로컬 상태·파생 계산·이벤트 핸들러·브라우저 전용 API(로컬 스토리지 등) 접근은 `hooks/`의 커스텀 훅으로 뽑아 View는 훅이 반환한 값과 핸들러만 사용한다.
- 커스텀 훅은 Action을 호출할 수 있다(View가 직접 호출하던 것을 그대로 옮긴 것). Supabase 쓰기 직접 호출과 업무 규칙 판단은 View와 동일하게 금지한다.
- 단일 `useState` 토글처럼 사소한 로컬 상태는 훅으로 추출하지 않고 View에 남겨도 된다. 여러 상태가 서로 얽히거나 파생 계산·이벤트 핸들러가 화면 흐름을 읽기 어렵게 만들 때만 추출한다.
- `scripts/check-architecture.mjs`의 Domain 금지 import 목록에 `hooks`를 추가해 Domain이 React 훅에 의존하지 못하게 막는다.

## 이유

- 이미 코드베이스에 `hooks/` 선례가 있어 새 개념을 만드는 대신 기존 패턴을 공식화하는 편이 학습 비용이 낮다.
- View 파일이 비대해지는 문제(예: 600줄이 넘는 관리자 일정 등록 View)를 재사용 가능한 단위로 쪼갤 수 있다.
- 훅과 View를 분리하면 훅만 단위 테스트하기 쉬워진다.

## 포기한 대안

- 로직을 `features/<feature>/components`로만 옮기기: `components/`는 이미 "업무 의미를 아는 프레젠테이션 UI"라는 의미로 쓰이고 있어(AGENTS.md 6절), 상태·이펙트 로직까지 얹으면 책임이 다시 섞인다.
- 새로운 최상위 계층 이름(예: `logic/`) 도입: VAC 명명 관례와 겹치지 않는 이름을 새로 학습시켜야 하고, React 관례상 이미 알려진 "커스텀 훅" 패턴과 불일치한다.

## 결과

- 새 화면을 만들거나 기존 View를 리팩터링할 때 로컬 상태·파생 계산이 View 본문에 쌓이면 `hooks/`로 추출한다.
- `features/schedule/views/admin-schedule-registration-view.tsx`처럼 이미 로직이 섞인 View는 다음 리팩터링에서 이 규칙을 적용한다. 이 ADR 자체가 기존 코드를 즉시 리팩터링하지는 않는다.
- 이 결정을 변경하려면(예: `hooks/` 폐지) 실제 적용 후 발견된 문제를 근거로 새 ADR이 필요하다.
