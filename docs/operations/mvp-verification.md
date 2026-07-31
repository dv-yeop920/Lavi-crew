# MVP 검증 기록

## 2026-07-31

- 범위: 외부 카카오 알림톡 제공자 실발송을 제외한 Supabase Auth·RLS·RPC와 핵심 업무 전이
- 원격 프로젝트: `vnfoyfcjpwxlurnhabla`
- 원격 마이그레이션: foundation부터 `complete_foreign_key_indexes`까지 25개 적용 확인
- 반복 가능한 시나리오: `supabase/tests/mvp_e2e.sql`
- 실행 방식: 단일 트랜잭션 안에서 테스트 사용자를 만들고 모든 assertion 이후 `rollback`
- 확인 항목: 가입 식별 검증, 월 신청·멱등 재실행·마감, 월 게시, 일별 배정 정정, 일정 취소, 출석 확정·급여 정정, 공지 CRUD·읽음, 초대 코드 생성·중지, 알바 본인 일정 RLS
- 마지막 전체 실행 결과: 모든 assertion 통과, 활성 급여 97,500원, 이전 급여 revision 무효화 1건, 취소 배정 revision 보존, 테스트 데이터 rollback 완료

외부 알림톡 제공자 자격 증명, 승인 템플릿, 자동 호출 스케줄과 실수신 확인은 별도 운영 단계로 남긴다.
