# ADR 005: Supabase RLS와 RPC 권한 경계

- 상태: 승인
- 결정일: 2026-07-24

## 배경

라비크루는 브라우저에서 Supabase Data API를 사용하며, 알바와 단일 관리자가 같은 테이블을 서로 다른 범위로 조회한다. 월 신청 마감, 신청 취소, 온보딩, 출석·급여 확정은 여러 행이나 권한 경계를 함께 변경하므로 일반 테이블 변경만으로는 업무 규칙과 원자성을 보장하기 어렵다.

## 결정

- 모든 `public` 테이블은 RLS를 활성화하고 Data API용 `GRANT`를 마이그레이션에서 명시한다.
- 알바의 소유 데이터와 관리자 접근을 하나의 동작별 정책으로 합쳐 중복 permissive policy를 피한다.
- 비활성 회원은 남아 있는 Auth 토큰으로도 업무 데이터를 읽거나 신청·취소할 수 없도록 RLS와 RPC에서 `profiles.is_active`를 검사한다. 로그인 후 활성 프로필을 얻지 못하면 세션을 즉시 종료한다.
- 관리자 판별의 권한 상승 구현은 노출되지 않는 `private.is_admin()`에 둔다.
- 공개 `SECURITY DEFINER` RPC는 다음 업무 단위만 허용한다.
  - `complete_worker_onboarding`
  - `cancel_own_schedule_application`
  - `close_application_period`
  - `confirm_attendance_and_payroll`
  - `admin_update_worker_profile`
  - `admin_deactivate_worker`
  - `update_own_profile`
  - `deactivate_own_profile`
- 각 공개 RPC는 `auth.uid()` 또는 활성 관리자 역할을 함수 내부에서 확인하며 `PUBLIC`과 `anon`에는 실행 권한을 주지 않는다.
- 가능한 포지션은 알바 본인 행과 관리자만 조회하고, 다른 알바의 포지션 숙련 정보는 RLS에서 차단한다.
- 신청·배정·출석·급여·공지의 운영 이력은 물리 삭제하지 않고 상태, 취소 일시, 정정 사유, 무효화 기록으로 보존한다.
- 출석 확정 RPC는 확정된 배정과 게시된 일정에만 허용하며 실제 출근·퇴근 시각을 필수로 받는다. 두 시각은 같은 KST 근무일 안에 있고 퇴근 시각은 미래가 아니어야 한다. 이미 확정된 기록을 정정할 때는 사유가 필수이며, 기존 급여 상세는 삭제하지 않고 무효화한 뒤 실제 확정 시간으로 다시 계산한다.

## 결과

- Server Action과 Repository의 권한 검사는 사용자 경험과 조기 실패를 담당하고, 최종 권한은 RLS와 RPC가 강제한다.
- 비활성화는 Auth 사용자를 물리 삭제하거나 전역 세션을 강제 폐기하지 않는다. 일반 로그인 직후 활성 프로필이 없으면 현재 세션을 종료하고, 이미 다른 기기에 남은 토큰은 RLS와 RPC가 업무 데이터 접근을 차단한다. 서비스 역할 기반 Auth ban·전역 세션 폐기는 부분 실패 보상 정책과 함께 후속 관리 기능으로 다룬다.
- Supabase Security Advisor는 의도적으로 공개한 `SECURITY DEFINER` RPC를 경고할 수 있다. 경고를 없애기 위해 서비스 역할 키를 일반 요청에 사용하거나 함수 내부 검사를 제거하지 않는다.
- 스키마 변경 후에는 Security·Performance Advisor, 외래 키 인덱스, 허용·거부 RLS 사례를 다시 검증한다.
