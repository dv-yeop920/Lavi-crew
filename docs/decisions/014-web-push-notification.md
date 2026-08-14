# 014. Web Push 알림 (VAPID)

## 상태

확정 (2026-08-13)

## 배경

알림 채널을 Web Push API(VAPID 프로토콜)로 구현한다. 기존 outbox 패턴(notification_logs → claim → send → complete/retry)을 그대로 재활용한다.

## 결정

- `push_subscriptions` 테이블의 존재 여부가 알림 대상 필터 조건이 된다.
- `notification_logs.channel` 기본값은 `'web_push'`이다.
- 서버 발송은 `web-push` npm 패키지(VAPID 프로토콜)를 사용한다.
- 브라우저는 Service Worker(`public/sw.js`)에서 push 이벤트를 수신하고 `showNotification`으로 표시한다.
- 구독 관리는 `upsert_push_subscription`/`delete_push_subscription` RPC로 처리하고, RLS로 자기 구독만 접근한다.

## 이유

- Web Push는 별도 제공자 계약·승인 템플릿 없이 VAPID 키만으로 발송할 수 있다.
- 브라우저 `Notification.permission`이 곧 동의이므로 별도 동의 컬럼이 불필요하다.
- outbox 패턴의 claim/complete/retry RPC 구조와 `SECURITY DEFINER` 보안 경계를 그대로 유지한다.

## 포기한 대안

- **Firebase Cloud Messaging**: 추가 Google 서비스 의존성. VAPID 표준만으로 충분하다.

## 환경 변수

- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: 서버 전용
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: 브라우저에서 구독 생성 시 사용
