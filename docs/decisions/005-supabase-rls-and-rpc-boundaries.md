# ADR 005: Supabase RLS와 RPC 권한 경계

- 상태: 승인
- 결정일: 2026-07-24

## 배경

라비에벨은 브라우저에서 Supabase Data API를 사용하며, 알바와 단일 관리자가 같은 테이블을 서로 다른 범위로 조회한다. 월 신청 마감, 신청 취소, 회원가입 식별 검증, 출석·급여 확정은 여러 행이나 권한 경계를 함께 변경하므로 일반 테이블 변경만으로는 업무 규칙과 원자성을 보장하기 어렵다.

## 결정

- 모든 `public` 테이블은 RLS를 활성화하고 Data API용 `GRANT`를 마이그레이션에서 명시한다.
- 알바의 소유 데이터와 관리자 접근을 하나의 동작별 정책으로 합쳐 중복 permissive policy를 피한다.
- 비활성 회원은 남아 있는 Auth 토큰으로도 업무 데이터를 읽거나 신청·취소할 수 없도록 RLS와 RPC에서 `profiles.is_active`를 검사한다. 로그인 후 활성 프로필을 얻지 못하면 세션을 즉시 종료한다.
- 관리자 판별의 권한 상승 구현은 노출되지 않는 `private.is_admin()`에 둔다.
- 공개 `SECURITY DEFINER` RPC는 다음 업무 단위만 허용한다.
  - 익명 가입 전용 `check_signup_identity`
  - `save_schedule_application_period`
  - `set_schedule_application_period_status`
  - `save_own_monthly_schedule_applications`
  - `save_monthly_schedule_registration`
  - `update_daily_schedule`
  - `cancel_daily_schedule`
  - `confirm_attendance_and_payroll`
  - `create_notice`, `update_notice`, `delete_notice`, `mark_notice_read`
  - `admin_update_worker_profile`
  - `admin_deactivate_worker`
  - `update_own_profile`
  - `deactivate_own_profile`
  - `create_invite_code`, `deactivate_invite_code`
- 알림 발송 상태 전이용 `claim_pending_notifications`, `complete_notification`, `retry_or_fail_notification`은 서버의 `service_role`에만 실행 권한을 부여한다.
- 업무 변경 RPC는 `auth.uid()` 또는 활성 관리자 역할을 함수 내부에서 확인하며 `PUBLIC`과 `anon`에는 실행 권한을 주지 않는다. `check_signup_identity`만 회원가입 전에 호출할 수 있도록 `anon`에 실행 권한을 부여하며 행이나 코드 원문 대신 세 가지 boolean 결과만 반환한다.
- 가능한 포지션은 알바 본인 행과 관리자만 조회하고, 다른 알바의 포지션 숙련 정보는 RLS에서 차단한다.
- 신청·배정·출석·급여·공지의 운영 이력은 물리 삭제하지 않고 상태, 취소 일시, 정정 사유, 무효화 기록으로 보존한다.
- 출석 확정 RPC는 확정된 배정과 게시된 일정에만 허용하며 실제 출근·퇴근 시각을 필수로 받는다. 두 시각은 같은 KST 근무일 안에 있고 퇴근 시각은 미래가 아니어야 한다. 이미 확정된 기록을 정정할 때는 사유가 필수이며, 기존 급여 상세는 삭제하지 않고 무효화한 뒤 실제 확정 시간으로 다시 계산한다.
- 월별 일정 등록 RPC는 활성 관리자만 호출한다. 요청 ID와 payload hash로 멱등성을 보장하고, 고정 8개 포지션의 기본 슬롯과 교육 추가 슬롯·동일 날짜 인원 중복·활성 계정·개인 시급을 함수에서 재검증한다. 성공 즉시 일정은 게시, 배정은 확정 상태로 저장하고 출석 및 푸시 구독자의 알림 발송 대기 행을 함께 만든다. 신청 기간·일정·배정·알림 테이블의 관리자 직접 DML 권한은 제거한다.
- 월별 일정 등록은 기존 신청 기간이 마감된 뒤에만 허용하며 마감일과 기간 상태를 변경하지 않는다. 신청 기간 생성·마감·재개는 별도 RPC로 처리하고, 일정 생성 이력이 있는 기간은 마감일 변경과 재개를 모두 거부한다.
- 알바는 게시 일정 전체가 아니라 본인의 활성 확정 배정이 있는 게시 일정만 조회한다. 관리자는 게시·취소 일정과 취소된 배정 이력을 조회할 수 있다.
- 초대 코드 생성·중지는 관리자 전용 멱등 RPC로만 처리하고 Data API 역할의 직접 쓰기 권한을 제거한다.

## 결과

- Server Action과 Repository의 권한 검사는 사용자 경험과 조기 실패를 담당하고, 최종 권한은 RLS와 RPC가 강제한다.
- 비활성화는 Auth 사용자를 물리 삭제하거나 전역 세션을 강제 폐기하지 않는다. 일반 로그인 직후 활성 프로필이 없으면 현재 세션을 종료하고, 이미 다른 기기에 남은 토큰은 RLS와 RPC가 업무 데이터 접근을 차단한다. 서비스 역할 기반 Auth ban·전역 세션 폐기는 부분 실패 보상 정책과 함께 후속 관리 기능으로 다룬다.
- Supabase Security Advisor는 의도적으로 공개한 `SECURITY DEFINER` RPC를 경고할 수 있다. 경고를 없애기 위해 서비스 역할 키를 일반 요청에 사용하거나 함수 내부 검사를 제거하지 않는다.
- 스키마 변경 후에는 Security·Performance Advisor, 외래 키 인덱스, 허용·거부 RLS 사례를 다시 검증한다.
