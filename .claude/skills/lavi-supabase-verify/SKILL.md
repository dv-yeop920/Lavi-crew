---
name: lavi-supabase-verify
description: Lavi Crew 저장소에서 DB·RLS·RPC·마이그레이션 변경을 검증하거나 "로컬 Supabase 검증", "test:db 돌려줘", "DB E2E 확인", "브라우저 E2E 실행" 같은 요청을 받았을 때, 로컬 Supabase를 기동해 db:reset → test:db(필요하면 test:e2e까지) 파이프라인을 올바른 순서와 전제조건으로 실행한다. 검증 시나리오 설계, 신규 테스트 작성, 기능 자체의 정합성 판단은 다루지 않는다(qa-qc-tester 서브에이전트의 역할).
disable-model-invocation: false
allowed-tools: Bash, Read
---

# 로컬 Supabase 검증 파이프라인

이 스킬은 **절차 실행**만 담당한다. `supabase/tests/mvp_e2e.sql`이나 `e2e/*.spec.ts`에 새 시나리오를 추가하거나 기능이 요구사항대로 동작하는지 판단하는 일은 `qa-qc-tester` 서브에이전트에게 맡긴다.

## 추가 자료를 여는 시점

이 파일만으로 표준 실행(전제조건 확인 → 명령 실행 → 보고)은 충분하다. 아래 상황에서만 추가로 연다.

- **`reference.md`**: 명령이 실패해 원인을 진단해야 할 때(자주 겪는 문제), `test:db`/`test:e2e`가 정확히 무엇을 검증하는지 보고서에 구체적으로 적어야 할 때, CI job과 로컬 실행이 다른 이유를 확인해야 할 때, `docs/operations/mvp-verification.md`에 새 실행 기록을 추가해야 할 때.
- **`examples.md`**: 처음 이 스킬을 실행해 결과를 어떤 형식으로 보고해야 할지 감이 필요할 때, 또는 일부 계층을 실행하지 못했을 때 그 사실을 어떻게 표현하는지 참고가 필요할 때.

둘 다 매번 열 필요는 없다. 표준 실행에서는 아래 절차만으로 충분하다.

## 시작 전 확인

1. Docker 호환 런타임과 `psql`이 있는지 확인한다. 없으면 AGENTS.md 11절에 따라 "로컬 Supabase 환경이 없어 실행하지 못함"으로 보고하고 중단한다. 추측으로 결과를 단정하지 않는다.
2. `.nvmrc` 기준 Node.js 22 이상인지 확인한다(`node -v`). `test:e2e`는 Node 22 이상, 로컬 Supabase API(54321)·PostgreSQL(54322)만 허용한다.
3. 브라우저 E2E가 필요하면 Chromium 설치 여부를 확인하고, 없으면 최초 1회 `npx playwright install chromium`을 실행한다.
4. 이미 로컬 Supabase가 떠 있을 수 있으니 `npx supabase status`로 먼저 확인해 불필요한 재시작을 피한다.

## DB E2E (`test:db`)

```bash
npm run db:start
npm run db:reset
npm run test:db
```

- `db:reset`은 `supabase/migrations/`를 처음부터 재적용한다. 새 마이그레이션을 추가했거나 스키마가 바뀐 뒤에는 반드시 다시 실행한다.
- `test:db`(`supabase/tests/mvp_e2e.sql`)는 관리자·알바 fixture를 트랜잭션 안에서 만들고 신청·마감·일정 게시/수정/취소·출석·급여·공지·초대 코드·RLS 허용/거부·멱등성 충돌과 실패 롤백을 검증한 뒤 전부 롤백한다. 트랜잭션 롤백이라 스키마가 그대로면 `db:reset` 없이 재실행해도 안전하다.
- 로컬 앱을 이 인스턴스에 연결해 확인해야 하면 `npx supabase status -o env`로 URL·키를 가져온다.
- 종료는 `npm run db:stop`.

## 브라우저 E2E (`test:e2e`)

```bash
npx playwright install chromium   # 최초 1회만
npm run db:start
npm run db:reset
npm run test:e2e
```

- **주의**: `test:e2e`(`scripts/run-browser-e2e.mjs`)는 고정 UUID fixture를 실제로 커밋하며 트랜잭션 롤백을 하지 않는다. 재실행 전에는 반드시 `npm run db:reset`을 다시 실행해야 하고, 생략하면 UNIQUE 제약 충돌로 실패한다.
- canonical origin은 `http://127.0.0.1:3000`으로 고정된다. 이미 3000번 포트에 다른 dev 서버가 떠 있다면 충돌 가능성을 먼저 확인한다.

## 자동화 스크립트

전제조건 확인부터 명령 실행까지 한 번에 하려면 `scripts/verify.sh`를 쓴다.

```bash
.claude/skills/lavi-supabase-verify/scripts/verify.sh          # DB E2E만
.claude/skills/lavi-supabase-verify/scripts/verify.sh --e2e    # 브라우저 E2E까지
```

Docker·psql·Node 버전 중 하나라도 전제조건을 만족하지 않으면 그 자리에서 중단하고 사유를 출력한다. 스크립트는 항상 `db:reset`을 실행하므로(결정적인 상태 보장) `test:db`만 빠르게 재확인하고 싶을 때는 `npm run test:db`를 직접 실행한다.

## 종료

```bash
npm run db:stop
```

다음 작업에서도 로컬 Supabase가 필요하면 바로 종료하지 않아도 된다. 애매하면 사용자에게 확인한다.

## 보고 형식

AGENTS.md 11절을 따라 다음을 포함한다.

- 실행한 명령과 실제 결과(pass/fail, 주요 assertion·시나리오 통과 개수 또는 실패 지점).
- 실행하지 못한 계층과 이유(Docker/psql/Playwright 부재, Node 버전 불일치 등)를 명확히 구분해 표기한다.
- `docs/operations/mvp-verification.md`에 기록할 만한 새로운 전체 실행 결과가 있으면, **실제로 실행한 경우에만** 갱신을 제안한다. 실행하지 않은 결과를 지어내 기록하지 않는다.
