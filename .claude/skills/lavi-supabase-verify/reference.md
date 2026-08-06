# 참고 자료

## 명령 요약

| 목적                   | 명령 순서                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| DB E2E만               | `npm run db:start` → `npm run db:reset` → `npm run test:db`                                                |
| 브라우저 E2E까지       | `npx playwright install chromium`(최초 1회) → `npm run db:start` → `npm run db:reset` → `npm run test:e2e` |
| 종료                   | `npm run db:stop`                                                                                          |
| 로컬 앱 연결 정보 확인 | `npx supabase status -o env`                                                                               |

## `test:db`가 검증하는 항목

`supabase/tests/mvp_e2e.sql` 기준(2026-07-31 `docs/operations/mvp-verification.md` 실행 기록):

- 가입 식별 검증
- 월 신청·멱등 재실행·다른 payload 충돌·마감
- 월 게시, 일별 배정 정정
- stale 수정 거부와 실패 request log rollback
- 일정 취소
- 출석 확정·급여 정정
- 공지 CRUD·읽음
- 초대 코드 생성·중지
- 알바 본인 일정 및 타인 급여 RLS
- 알바의 관리자 RPC 거부

## `test:e2e`가 검증하는 항목

`e2e/auth-and-role.spec.ts` 기준:

- 실제 관리자·알바 로그인과 세션 지속·역할 보호·로그아웃
- 월 신청 기간 생성
- 알바 2일 신청·1일 취소와 새로고침 영속성
- 관리자 수동 마감과 알바 잠금
- 이틀 20개 포지션 배정·즉시 게시
- 일별 배정 수정
- 알바 본인 일정 월·주·일 조회
- Mailpit 가입 메일·PKCE callback·재로그인
- 320px 가로 overflow와 focus-visible
- 예상하지 않은 console/page/HTTP 5xx 오류 부재

## CI와의 대응 관계

`.github/workflows/ci.yml`은 애플리케이션 검증과 별도로 두 job을 돌린다.

- `database` job: 빈 로컬 Supabase에 전체 마이그레이션을 적용하고 이 스킬의 DB E2E와 동일한 명령을 실행한다.
- `browser` job: Chromium과 로컬 Supabase를 설치·초기화한 뒤 이 스킬의 브라우저 E2E와 동일한 명령을 실행하고 실패 시 trace·screenshot을 보존한다.

로컬에서 실패를 재현할 때는 이 job들과 같은 순서를 따라야 CI와 같은 조건이 된다.

## 자주 겪는 문제

- **`db:start`가 실패한다**: Docker 호환 런타임(Docker Desktop, OrbStack 등)이 실행 중인지 먼저 확인한다.
- **`test:e2e`가 UNIQUE 제약 위반으로 실패한다**: 직전 실행의 fixture가 남아 있다는 뜻이다. `npm run db:reset` 후 다시 실행한다.
- **`test:e2e`가 포트 충돌로 실패한다**: 3000번 포트에 이미 떠 있는 `npm run dev` 서버를 먼저 종료한다. runner는 production 빌드를 자체 기동하므로 기존 dev 서버와 공존할 수 없다.
- **Node 버전 오류**: `nvm use`로 `.nvmrc`(22)를 맞춘다.
- **가입 확인 메일을 눈으로 보고 싶다**: 로컬 Mailpit UI(`npx supabase status -o env`로 URL 확인)에서 확인한다.

## `docs/operations/mvp-verification.md` 갱신 기준

새 날짜의 전체 실행 기록을 추가할 때만 이 문서를 갱신한다. 실행하지 않은 결과를 적지 않는다. 기존 항목(2026-07-31)의 형식(범위·원격 마이그레이션·반복 시나리오·실행 방식·확인 항목·결과·CI 대응)을 그대로 따른다.
