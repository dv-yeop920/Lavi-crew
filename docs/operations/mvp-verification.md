# MVP 검증 기록

## 2026-07-31

- 범위: 외부 카카오 알림톡 제공자 실발송을 제외한 Supabase DB identity fixture·RLS·RPC와 핵심 업무 전이
- 원격 프로젝트: `vnfoyfcjpwxlurnhabla`
- 원격 마이그레이션: foundation부터 `complete_foreign_key_indexes`까지 25개 적용 확인
- 반복 가능한 시나리오: `supabase/tests/mvp_e2e.sql`
- 로컬 실행: `npm run db:start && npm run db:reset && npm run test:db`
- 실행 방식: 빈 로컬 DB에 전체 마이그레이션을 적용하고, 단일 트랜잭션 안에서 필요한 Auth·프로필 fixture를 자체 생성한 뒤 모든 assertion 이후 `rollback`
- 확인 항목: 가입 식별 검증, 월 신청·멱등 재실행·다른 payload 충돌·마감, 월 게시, 일별 배정 정정, stale 수정 거부와 실패 request log rollback, 일정 취소, 출석 확정·급여 정정, 공지 CRUD·읽음, 초대 코드 생성·중지, 알바 본인 일정 및 타인 급여 RLS, 알바의 관리자 RPC 거부
- 마지막 로컬 전체 실행 결과: clean reset 후 모든 assertion 통과, 활성 급여 97,500원, 이전 급여 revision 무효화 1건, 취소 배정 revision 보존, 실패 request log 0건, 테스트 데이터 rollback 완료
- CI: `.github/workflows/ci.yml`의 `database` job이 동일한 reset·E2E 명령을 실행한다.
- 미검증: 실제 Auth signUp·메일 확인·callback·로그인/세션·비밀번호 재설정과 핵심 브라우저 여정·모바일 smoke는 별도 브라우저 검증으로 남아 있다.

외부 알림톡 제공자 자격 증명, 승인 템플릿, 자동 호출 스케줄과 실수신 확인은 별도 운영 단계로 남긴다.
