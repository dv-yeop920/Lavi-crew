# 실행 예시

## 예시 1: 새 마이그레이션 추가 후 DB 검증만 필요할 때

상황: `supabase/migrations/`에 새 파일을 추가하고 RLS 정책을 바꿨다. 브라우저까지는 필요 없다.

```bash
npm run db:start
npm run db:reset
npm run test:db
```

보고 예시:

> DB E2E 실행: `db:reset`으로 전체 마이그레이션(최신 파일 포함) 재적용 후 `test:db` 실행, 전체 assertion 통과(신청·마감·배정·출석·급여·공지·초대 코드·RLS 허용/거부 포함). 실패한 항목 없음. 브라우저 E2E는 이번 변경 범위와 무관해 실행하지 않음.

## 예시 2: 기능 구현 완료 후 전체 파이프라인 실행, 일부 환경 누락

상황: 신규 기능 구현 후 전체 검증을 시도했는데 이 환경에 Playwright가 설치돼 있지 않다.

```bash
npm run db:start
npm run db:reset
npm run test:db
# Playwright 미설치로 npx playwright install chromium 필요 → 이 환경에서 실행 불가
```

보고 예시:

> DB E2E는 통과(모든 assertion, 실패 0건). 브라우저 E2E(`test:e2e`)는 이 환경에 Chromium이 설치돼 있지 않아 실행하지 못함 — `npx playwright install chromium` 실행 후 재시도가 필요함을 명시.

## 예시 3: 헬퍼 스크립트로 한 번에 실행

```bash
.claude/skills/lavi-supabase-verify/scripts/verify.sh          # DB E2E만
.claude/skills/lavi-supabase-verify/scripts/verify.sh --e2e    # 브라우저 E2E까지
```

스크립트는 Docker·psql·Node 버전 전제조건을 먼저 확인하고, 하나라도 없으면 그 시점에서 중단한다. `--e2e`를 주면 항상 `npm run db:reset`을 다시 실행한 뒤 `test:e2e`를 실행해 이전 fixture와의 충돌을 피한다.
