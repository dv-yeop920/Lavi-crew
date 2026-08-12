# Lavi Crew

라비에벨 웨딩홀 구성원을 위한 모바일 우선 스케줄·출석·급여 관리 웹입니다. 하나의 Next.js 앱에서 Supabase Auth의 역할에 따라 관리자와 알바 화면을 분리합니다.

## 기술 구성

- Next.js 16, React 19, React Compiler
- TypeScript, vanilla-extract
- Supabase Auth, PostgreSQL, RLS, RPC
- Zod, Vitest, Playwright

Node.js 버전은 `.nvmrc`의 22를 사용합니다.

## 애플리케이션 실행

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

`.env.local`에는 최소 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 필요합니다. 서비스 역할 키와 외부 제공자 키는 브라우저에 노출하거나 저장소에 커밋하지 않습니다.

## 로컬 Supabase와 DB E2E

Docker 호환 런타임과 `psql`이 필요합니다.

```bash
npm run db:start
npm run db:reset
npm run test:db
```

`db:reset`은 `supabase/migrations/`를 처음부터 적용합니다. `test:db`는 관리자·알바 fixture를 트랜잭션 안에서 만들고 신청, 마감, 일정 게시·수정·취소, 출석·급여, 공지, 초대 코드, RLS, 멱등성 충돌과 실패 롤백을 검증한 뒤 모든 데이터를 롤백합니다.

로컬 앱을 Supabase에 연결할 때 사용할 URL과 키는 `npx supabase status -o env`로 확인할 수 있습니다. 종료는 `npm run db:stop`입니다.

## 실제 Auth·브라우저 E2E

Playwright Chromium을 한 번 설치한 뒤, 반드시 clean 로컬 DB에서 실행합니다.

```bash
npx playwright install chromium
npm run db:start
npm run db:reset
npm run test:e2e
```

`test:e2e`는 Node.js 22 이상과 로컬 Supabase API(54321)·PostgreSQL(54322)만 허용합니다. runner는 Next.js와 Supabase `site_url`이 공유하는 canonical origin을 `http://127.0.0.1:3000`으로 고정합니다. 임의 비밀번호와 고정 UUID의 관리자·알바 fixture를 만든 뒤 production Next.js 서버에서 실제 이메일·비밀번호 세션, 역할 보호, 신청·취소·월 마감, 일정 등록·배정·수정, 월·주·일 조회와 Mailpit 이메일 확인 callback을 검증합니다. 실행마다 fixture가 남으므로 재실행 전 `npm run db:reset`이 필요합니다.

## 초기 구성원 시드

운영을 시작할 구성원이 필요하면 `npm run seed:crew`로 초기 명단을 만듭니다. 이 스크립트는 Auth Admin API로 인증 계정을 만들고 `public.profiles`와 `public.worker_position_skills`에 행을 넣습니다. RLS를 끄거나 정책을 우회하지 않으며, 생성된 구성원은 실제 UUID를 갖기 때문에 일정 배정·출석·급여가 데이터베이스에 그대로 저장됩니다.

`.env.local`에 `SUPABASE_SERVICE_ROLE_KEY`, `LAVI_ALLOW_CREW_SEED=1`, `LAVI_CREW_SEED_PASSWORD`를 채운 뒤 실행합니다. `seed:crew`는 `node --env-file=.env.local`로 이 파일을 직접 읽습니다.

```bash
npm run seed:crew
```

이메일은 예약 도메인 `example.com`, 연락처는 통신사 미할당 대역 `010-0000-XXXX`를 사용합니다. 같은 이메일이 이미 있으면 인증 계정을 다시 만들지 않고 프로필과 포지션 가능 여부만 갱신하므로 여러 번 실행해도 안전합니다. 시드 이후에는 사용한 서비스 키와 비밀번호 환경 변수를 즉시 제거합니다.

명단의 단일 원본은 `scripts/lib/crew-roster.mjs`입니다. 이름·시급·가능한 포지션을 바꾸려면 이 파일만 고칩니다.

### 월별 신청 시드

일정 등록 화면의 인원 셀렉트는 **그 날짜에 신청한 인원만** 표시합니다(업무 규칙, AGENTS.md 9절). 시드로 만든 구성원은 신청 기록이 없으므로 셀렉트가 비어 있습니다. `npm run seed:crew-applications`가 대상 월의 모든 주말에 구성원 신청을 등록합니다.

이 스크립트는 서비스 역할 키를 쓰지 않습니다. 각 구성원 본인 세션으로 로그인해 화면과 동일한 `save_own_monthly_schedule_applications` RPC를 호출하므로 RLS가 그대로 적용됩니다. 대상 월의 신청 기간이 **열려 있어야** 하며, 마감된 달은 관리자 일정 달력에서 `신청 다시 열기`를 먼저 눌러야 합니다.

```bash
LAVI_SEED_APPLICATION_MONTH=2026-09 npm run seed:crew-applications
```

등록이 끝나면 관리자 화면에서 `신청 수동 마감`을 눌러 다시 마감한 뒤 일정을 확정합니다.

## 품질 검증

```bash
npm run check:harness
npm run check:architecture
npm run format:check
npm run lint
npm test
npm run build
```

CI는 위 애플리케이션 검증과 별도로 빈 로컬 Supabase의 전체 마이그레이션·DB E2E와 인증된 모바일 Chromium 브라우저 E2E를 실행합니다.

설계와 운영 근거는 `docs/architecture.md`, `docs/decisions/`, `docs/operations/mvp-verification.md`를 참고합니다. 카카오 알림톡 실제 발송은 승인된 템플릿과 운영 자격 증명이 준비된 뒤 별도 검증합니다.
