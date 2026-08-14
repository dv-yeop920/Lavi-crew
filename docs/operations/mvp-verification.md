# MVP 검증 기록

## 2026-07-31

- 범위: 외부 Web Push 실발송을 제외한 Supabase DB identity fixture·RLS·RPC와 핵심 업무 전이
- 원격 프로젝트: `vnfoyfcjpwxlurnhabla`
- 원격 마이그레이션: foundation부터 `complete_foreign_key_indexes`까지 25개 적용 확인
- 반복 가능한 시나리오: `supabase/tests/mvp_e2e.sql`
- 로컬 실행: `npm run db:start && npm run db:reset && npm run test:db`
- 실행 방식: 빈 로컬 DB에 전체 마이그레이션을 적용하고, 단일 트랜잭션 안에서 필요한 Auth·프로필 fixture를 자체 생성한 뒤 모든 assertion 이후 `rollback`
- 확인 항목: 가입 식별 검증, 월 신청·멱등 재실행·다른 payload 충돌·마감, 월 게시, 일별 배정 정정, stale 수정 거부와 실패 request log rollback, 일정 취소, 출석 확정·급여 정정, 공지 CRUD·읽음, 초대 코드 생성·중지, 알바 본인 일정 및 타인 급여 RLS, 알바의 관리자 RPC 거부
- 마지막 로컬 전체 실행 결과: clean reset 후 모든 assertion 통과, 활성 급여 97,500원, 이전 급여 revision 무효화 1건, 취소 배정 revision 보존, 실패 request log 0건, 테스트 데이터 rollback 완료
- CI: `.github/workflows/ci.yml`의 `database` job이 동일한 reset·E2E 명령을 실행한다.
- 브라우저 자동화: `e2e/auth-and-role.spec.ts`, 실행 순서 `npm run db:reset` → `npm run test:e2e`
- 브라우저 fixture 경계: 로컬 API 54321과 PostgreSQL 54322를 모두 확인하고, 기존 3000번 서버를 재사용하지 않으며 실행별 임의 비밀번호·고유 가입 이메일을 사용한다.
- 브라우저 확인 항목: 실제 관리자·알바 로그인과 세션 지속·역할 보호·로그아웃, 월 신청 기간 생성, 알바 2일 신청·1일 취소와 새로고침 영속성, 관리자 수동 마감과 알바 잠금, 이틀 20개 포지션 배정·즉시 게시, 일별 배정 수정, 알바 본인 일정 월·주·일 조회, Mailpit 가입 메일·PKCE callback·재로그인, 320px 가로 overflow와 focus-visible, 예상하지 않은 console/page/HTTP 5xx 오류 부재
- 마지막 브라우저 실행 결과: mobile Chromium 4개 시나리오 모두 통과(2026-07-31, production build + local Supabase)
- CI: `.github/workflows/ci.yml`의 `browser` job이 Chromium과 로컬 Supabase를 설치·초기화한 뒤 같은 브라우저 검증을 실행하고 실패 trace·screenshot을 보존한다.
- 별도 검증: 비밀번호 재설정 메일, 관리자 일정 취소 UI, 출석 입력과 급여 화면의 역할 교차 브라우저 여정은 후속 자동화 범위다. DB/RPC 수준의 일정 취소·출석·급여 정합성은 `test:db`에서 검증한다.

VAPID 키 설정과 실수신 확인은 별도 운영 단계로 남긴다.
