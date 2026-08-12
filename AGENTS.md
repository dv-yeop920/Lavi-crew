# Lavi Crew Repository Instructions

## 1. 프로젝트 개요

- 목적: 라비에벨 웨딩홀 구성원의 스케줄 신청·배정·출석·급여·공지 관리를 제공한다.
- 사용자 역할: `worker`와 단일 `admin`을 지원한다.
- 앱 구성: 관리자와 알바를 별도 앱으로 나누지 않고 하나의 Next.js 앱에서 라우트와 레이아웃으로 분리한다.
- 화면 경로: 공통 인증 화면은 `/`, 알바 화면은 `/home`, 관리자 화면은 `/admin`을 기준으로 한다.

## 2. 원본 문서 우선순위

- 확정 요구사항과 업무 규칙: `docs/requirements-specification.html`
- 사용자 흐름: `docs/user-flow.html`
- 화면 구조: `docs/screen-architecture.html`
- DB 구조: `docs/supabase-erd.html`
- 코드 아키텍처: `docs/architecture.md`
- 디자인·퍼블리싱: `Design.md`
- 확정한 기술 결정과 포기한 대안: `docs/decisions/`
- 도메인 용어: `docs/domain/glossary.md`
- 구현 예시와 세부 경계: `docs/conventions/`
- 실패한 접근과 현재 대안: `docs/failures/`
- 문서와 코드가 충돌하면 임의로 한쪽을 선택하지 않는다. 영향 범위를 확인하고 사용자에게 결정이 필요한 차이를 보고한다.
- UI 작업은 구현 전에 `Design.md` 전체를 읽는다. 확인되지 않은 디자인 값은 추측하지 않는다.
- 아키텍처, 의존성, 데이터 모델을 바꿀 때는 관련 ADR과 실패 기록을 먼저 확인한다. 기존 결정을 뒤집는다면 같은 변경에서 ADR 상태와 이유를 갱신한다.

## 3. 기술 스택과 명령

- Next.js App Router 16, React 19, TypeScript strict mode
- vanilla-extract, React Compiler
- Supabase Auth, PostgreSQL, RLS
- Kakao 알림톡
- 패키지 관리자는 npm을 사용하고 `package-lock.json`을 유지한다.
- 개발 서버: `npm run dev`
- 정적 검사: `npm run lint`
- ESLint 자동 수정과 import 정렬: `npm run lint:fix`
- Prettier 적용: `npm run format`
- Prettier 검사: `npm run format:check`
- 아키텍처 경계 검사: `npm run check:architecture`
- 하네스 드리프트 검사: `npm run check:harness`
- 프로덕션 빌드: `npm run build`
- 프로덕션 실행: `npm run start`
- 단위 테스트: `npm test`
- 테스트 감시 모드: `npm run test:watch`
- 로컬 Supabase 시작·리셋·DB E2E·브라우저 E2E의 전체 절차와 명령은 `README.md`를 따른다.

## 4. 디렉토리 책임

아직 생성되지 않은 디렉토리는 기능 구현 시 아래 목표 구조에 맞춰 만든다.

```text
app/                       # 라우트, 레이아웃, 페이지 조합
features/<feature>/        # 기능별 VAC, 스키마, 기능 컴포넌트
  views/
  hooks/
  actions/
  controllers/
  domain/
  repositories/
  schemas/
  components/
shared/auth/               # 공통 인증·역할 확인
shared/supabase/           # Supabase 클라이언트와 서버 연결
shared/ui/                 # 도메인 비의존 공통 UI
shared/lib/                # 도메인 비의존 순수 유틸리티
docs/                      # 기획·아키텍처 문서
  decisions/               # 기술 결정과 대안(ADR)
  conventions/             # 구체적인 구현 예시
  domain/                  # 용어와 업무 지식
  failures/                # 실패한 접근과 현재 대안
```

- `app`에는 업무 규칙이나 Supabase 쓰기 쿼리를 넣지 않는다.
- 기능에 종속된 코드는 `features/<feature>`에 둔다.
- `shared`는 `app`이나 `features`를 import하지 않는다.
- 기능 간에 상대 기능의 내부 파일을 직접 import하지 않는다. 공통 의미가 확인된 타입과 UI만 `shared`로 승격한다.
- 하위 디렉토리에 별도 `AGENTS.md`를 추가할 때는 그 영역의 예외만 기록하고 루트 규칙을 복사하지 않는다.
- `scripts/check-architecture.mjs`가 감지하는 경계 위반은 예외 처리로 우회하지 말고 구조를 바로잡는다. 검사기가 아직 감지하지 못한다는 이유로 문서의 경계를 어겨도 되는 것은 아니다.

## 5. VAC 아키텍처 규칙

호출 방향은 다음을 지킨다.

```text
View → Hook → Action → Controller → Domain / Repository → Supabase
                                  └→ Kakao Adapter
```

- View: 표시, 레이아웃, 입력 마크업만 담당한다. Supabase 쓰기와 업무 규칙을 금지한다. 로컬 상태·파생 계산·이벤트 핸들러가 얽히면 Hook으로 추출한다. 단일 상태 토글처럼 사소한 로컬 상태까지 강제로 추출하지 않는다.
- Hook: `features/<feature>/hooks`에 두는 커스텀 React 훅으로 View의 로컬 상태, 파생 계산, 이벤트 핸들러, 브라우저 전용 API 접근을 담당한다. Action 호출은 할 수 있지만 Supabase 쓰기 직접 호출과 업무 규칙 판단은 View와 동일하게 금지한다(`docs/decisions/013-view-hook-separation.md`).
- Action: 입력 수신, 스키마 검증, Controller 호출, 캐시 갱신만 담당한다.
- Controller: 역할 확인, 유스케이스 조합, Domain·Repository·Adapter 호출을 담당한다.
- Domain: DB, React, Next.js, 외부 API에 의존하지 않는 순수 로직만 둔다.
- Repository: Supabase 조회·저장만 담당하고 업무 정책을 판단하지 않는다.
- Adapter: 카카오 알림톡 같은 외부 API를 격리하고 도메인 규칙을 판단하지 않는다.
- 여러 테이블을 함께 변경하는 마감·배정 확정·급여 산정은 Postgres RPC로 원자 처리한다.

## 6. 디자인과 공통 컴포넌트

- 시각 규칙은 `Design.md`를 단일 기준으로 사용한다.
- `Design.md`의 FSD 경로 예시보다 이 문서와 `docs/architecture.md`의 실제 구조를 우선한다.
- 정적 스타일은 `*.css.ts`에 작성한다. 런타임 계산이 필요한 값 외에는 인라인 스타일을 사용하지 않는다.
- 컴포넌트에서는 Atomic token이나 HEX 값 대신 Semantic token을 사용한다.
- 버튼, 입력, 배지처럼 도메인 의미가 없는 UI만 `shared/ui/<component>/`에 둔다.
- 스케줄 카드, 급여 요약처럼 업무 의미를 아는 UI는 `features/<feature>/components`에 둔다.
- 디자인 시스템 기본 요소이거나 두 기능 이상에서 같은 의미와 동작으로 사용될 때만 공통 UI로 승격한다.
- 공통 UI는 Supabase, Server Action, Controller, 기능 도메인 타입에 의존하지 않는다. 값, 표준 HTML 속성, 콜백을 입력으로 받는다.
- 공통 UI는 Server Component 호환을 기본으로 하고 상호작용이 필요한 가장 작은 파일에만 `'use client'`를 선언한다.
- Figma Variant는 문자열 union prop으로 제한한다. 호출부에서 내부 색상·padding·radius를 임의로 주입하는 prop을 만들지 않는다.
- 컴포넌트는 내부 시각 스타일과 접근성을, 페이지는 배치와 외부 간격을 책임진다.
- `disabled`, `loading`, 오류, 빈 상태, focus, 키보드 조작, 접근 가능한 이름을 함께 설계한다.

## 7. TypeScript와 React 규칙

- 컴포넌트와 타입은 `PascalCase`, 함수와 변수는 `camelCase`를 사용한다.
- boolean 변수는 의미에 맞게 `is`, `has`, `can`, `should` 접두사를 사용한다.
- 기능·컴포넌트 디렉토리는 `kebab-case`를 사용한다. Next.js 예약 파일명은 `page.tsx`, `layout.tsx`, `route.ts`를 유지한다.
- 내부 import는 `@/*` 경로 별칭을 우선하고 깊은 `../../../` 상대 경로를 만들지 않는다.
- import 그룹은 빈 줄로 구분하고 `비스타일 side effect` → `Node 내장 모듈` → `외부 패키지` → `@/ 내부 모듈` → `기타 절대 경로` → `상위 상대 경로` → `동일 디렉토리 상대 경로` → `스타일` 순서를 지킨다.
- 각 import 그룹 내부와 re-export는 `eslint-plugin-simple-import-sort` 결과를 따른다. 수동 정렬 규칙을 추가하거나 ESLint `sort-imports`, `import/order`를 함께 켜지 않는다.
- `any`를 새로 추가하지 않는다. 외부 입력은 `unknown`으로 받고 검증 후 좁힌다.
- 서버 모듈을 Client Component에서 import하지 않는다.
- React Compiler를 사용하므로 습관적으로 `useMemo`, `useCallback`, `memo`를 추가하지 않는다. 외부 라이브러리의 참조 동일성 요구나 측정된 병목이 있을 때만 사용한다.
- 입력값이 있는 폼은 기능별 `schemas`의 Zod 스키마로 검증한다. Action은 `safeParse` 실패 시
  필드별 오류를 반환하고, 검증 전 값을 Controller나 Repository로 전달하지 않는다.
- 폼 오류는 공통 `FormActionResult` 계약을 사용한다. 사용자가 수정할 수 있는 오류는 해당 입력과
  `aria-describedby`로 연결하고 Semantic `negative` 색상으로 표시한다. 원본 DB·Auth 오류 문구나
  개인정보는 브라우저에 그대로 반환하지 않는다.

## 8. 보안과 데이터 규칙

- Supabase Auth 로그인 식별자는 이메일이며 비밀번호 가입과 이메일 확인 흐름을 사용한다.
- 휴대폰 번호는 인증 식별자가 아니라 `public.profiles`의 업무 연락처로 저장하고 가입 시 함께 입력받는다.
- 이메일 확인 전에는 업무 화면 세션을 허용하지 않는다. 초대 코드 검증과 프로필 생성은 서버 경계에서 원자적으로 처리한다.
- UI 숨김은 권한 검사가 아니다. 서버의 역할 확인과 Supabase RLS를 모두 적용한다.
- 알바는 자신의 프로필·신청·배정·급여만 접근하도록 정책을 작성한다. 전체 일정 조회에 필요한 다른 인원의 이름과 포지션 배정은 민감 정보(시급·연락처)를 제외한 별도 경로로만 노출한다.
- 관리 기능은 `admin` 역할을 서버에서 다시 확인한다.
- 브라우저에는 Supabase 익명 키만 노출할 수 있다.
- `SUPABASE_SERVICE_ROLE_KEY`와 카카오 API 키는 서버 전용 환경 변수와 서버 모듈에서만 사용한다.
- `.env.example`에는 변수명과 설명만 두고 실제 키·전화번호·초대 코드를 넣지 않는다.
- 관계 데이터가 있는 회원은 물리 삭제하지 않고 비활성화 상태로 처리한다.
- 게시된 일정의 배정을 변경하면 기존 급여 항목을 무효 처리하고 새 급여를 재산정한다.

## 9. 변경하면 안 되는 업무 규칙

- 급여는 관리자가 게시한 일정의 예정 근무 시간(shifts.start_time/end_time)으로 배정 확정 시점에 산정한다.
- 하루 9시간까지 인원별 시급, 9시간 초과분은 해당 인원 시급의 1.5배로 계산한다.
- 식대, 교통비, 주휴수당은 MVP 급여 계산에서 제외한다.
- 스케줄 신청은 관리자가 마감하기 전까지만 취소할 수 있다.
- 스케줄 신청 마감은 근무일별이나 주별이 아니라 대상 월 전체에 한 번 적용한다.
- 관리자 일정 달력에서 등록할 날짜를 직접 선택하고, 달력 화면에서 월 전체 신청 기간(마감일)을 설정한다. 날짜를 하나 이상 선택하면 일정 등록 버튼이 나타나고, 등록 화면에서는 선택한 날짜별 일정만 설정한다. 주말 제한 없이 모든 날짜를 등록할 수 있다.
- 관리자 인원 배정은 스케줄 등록 화면에 포함한다.
- 관리자는 선택한 날짜에 신청한 인원만 신규 배정할 수 있으며 교육 여부를 표시할 수 있다.
- 운영 포지션은 팀장·스캔·메인·드레스·축가·매니저·안내·대기실 8개로 고정한다. 포지션별 시급은 두지 않으며 관리자는 인원 관리 상세에서 구성원별 시급을 수정한다.
- 관리자 알바 목록과 상세에는 마스킹한 연락처를 표시한다. 회원 삭제 요청은 관계 이력을 보존하는 계정 비활성화로 처리한다.
- 위 규칙을 변경해야 하는 요청은 구현 전에 요구사항 문서와 함께 사용자 결정을 받는다.

## 10. 절대 금지

- View나 Client Component에서 Supabase 쓰기 쿼리를 직접 호출하지 않는다.
- `service_role` 키, 카카오 키, 비밀번호, 실제 초대 코드를 코드·문서·로그·fixture에 기록하지 않는다.
- RLS를 끄거나 `service_role`로 사용자 권한 검사를 우회하지 않는다.
- 확정 급여·배정 이력을 `DELETE`로 제거하지 않는다.
- `Design.md`에서 TBD인 색상·간격·타이포그래피 값을 추측해 디자인 토큰으로 확정하지 않는다.
- 사용자 요청 없이 프로덕션 의존성을 추가하지 않는다.
- 사용자 요청 없이 커밋, push, 배포, 원격 데이터 변경을 하지 않는다.
- 기존 작업 트리의 관련 없는 변경을 수정하거나 되돌리지 않는다.
- 커밋을 요청받으면 작업 범위의 파일만 stage하고 `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` 중 맞는 접두사를 사용한다.

## 11. 검증과 완료 조건

- 모든 코드 변경에서 `npm run format:check`, `npm run lint`, `npm run check:architecture`를 실행한다.
- 동작 로직을 변경하면 관련 `npm test`도 실행한다.
- 하네스, 문서 경로, 검사 명령을 변경하면 `npm run check:harness`를 실행한다.
- 라우트, 레이아웃, 의존성, Next 설정, 서버·클라이언트 경계를 변경하면 `npm run build`도 실행한다.
- Domain 규칙을 변경하면 경계값과 오류 사례 테스트를 추가한다. 테스트 도구가 아직 없다면 임의로 선택하지 말고 미설정 상태와 필요한 결정을 보고한다.
- UI 변경은 관련 모바일 너비, 콘텐츠 겹침, safe area, 키보드 접근, loading·오류·빈 상태를 확인한다. 확정된 breakpoint가 없으면 새로운 기준값을 문서화하지 않는다.
- DB 변경은 허용·거부 RLS 사례, 제약조건, RPC 원자성, 마이그레이션 순서를 확인한다. 로컬 Supabase 환경이 없으면 실행하지 못한 검증을 명시한다.
- 문서만 변경해도 `git diff --check`로 공백 오류를 확인한다.
- CI의 `check:harness` → `check:architecture` → `format:check` → `lint` → `build` 센서가 모두 통과해야 병합 가능한 상태다.
- 오류 메시지는 실패한 파일, 규칙, 다음 조치를 특정할 수 있게 작성한다.
- 완료 보고에는 변경 파일, 실행한 검증, 실행하지 못한 검증과 이유를 포함한다.

## 12. 정리와 드리프트 방지

- 임시 파일은 작업 완료 전에 삭제한다.
- `temp-*`, `temp_*`, `*_new`, `*_old`, `*_backup`, `*_fix`, `*.bak`, `*.tmp` 이름의 작업 파일을 소스·문서 경로에 남기지 않는다.
- 사용하지 않는 import, 디버그 출력, 주석 처리한 대체 구현을 완료 전에 제거한다.
- 코드와 문서가 달라진 경우 같은 변경에서 관련 문서 또는 ADR을 갱신한다.
- 실패한 접근이 반복될 가능성이 있으면 `docs/failures/`에 이유와 현재 대안을 기록한다. 실제 실패가 없는데 기록을 꾸며내지 않는다.

## 13. 하네스 파일 책임

이 저장소는 Claude Code 하네스만 사용한다.

- `AGENTS.md`: 이 저장소 전체에 항상 적용되는 규칙과 명령의 원본
- `CLAUDE.md`: Claude Code 진입점. `@AGENTS.md` import로 이 문서를 그대로 불러오고 Claude Code 전용 보충 정보만 덧붙인다. 규칙을 바꿀 때는 이 파일이 아니라 AGENTS.md를 수정한다.
- Claude Code 세션 간 지속 메모리(`~/.claude/projects/.../memory/`): 대화 세션 재시작이나 `/clear`로도 사라지지 않는 파일 기반 저장소. 사용 방식과 기록 기준은 `CLAUDE.md`에 원본으로 두고 여기서는 중복 서술하지 않는다.
- `.claude/agents/*.md`: Claude Code 전용 서브에이전트 정의 (품질 리뷰, 프론트엔드 구현 등)
- `.claude/skills/*/SKILL.md`: Claude Code 전용 스킬 정의(반복 절차를 현재 에이전트가 직접 따르게 함). 목록과 용도는 `CLAUDE.md`에 원본으로 둔다.
- `.claude/settings.json`과 `.claude/hooks/*`: Claude Code 훅. `check-agents-compliance.mjs`는 `app`·`features`·`shared`·`docs`·`scripts`·`.claude`·`AGENTS.md`·`CLAUDE.md` 파일을 Edit·MultiEdit·Write로 바꿀 때마다 `check:architecture`·`check:harness`·해당 파일의 eslint를 자동 실행해 위반을 그 자리에서 차단한다(9절의 업무 규칙처럼 정적 분석으로 판별할 수 없는 항목은 다루지 않는다). `block-dangerous-bash.mjs`는 되돌릴 수 없는 파괴적 Bash 명령을 실행 전에 차단한다.
- `scripts/check-architecture.mjs`: import 방향과 서버·클라이언트 경계 센서
- `scripts/check-harness.mjs`: 문서·에이전트·임시 파일 드리프트 센서
- `.github/workflows/ci.yml`: 저장소 병합 전 전체 검증 센서
- 같은 규칙을 여러 하네스 파일에 복사하지 않는다. 원본 한 곳을 두고 다른 파일에서는 참조한다.
- `AGENTS.md`와 `docs`는 작업 전·중 방향을 주는 가이드이고, 린트·검사 스크립트·빌드·CI는 작업 후 위반을 감지하는 센서다. 가이드와 센서의 규칙이 다르면 둘 중 하나를 임의로 우회하지 말고 함께 정합시킨다.
- 제품 범위나 화면 흐름이 바뀌는 복합 작업은 관련 있는 `.claude/agents/*.md` 서브에이전트를 필요에 따라 조합해 사용한다.
