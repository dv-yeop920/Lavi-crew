# 015. 애플리케이션 코드를 `src` 디렉터리로 통합

## 상태

확정 (2026-08-17)

## 배경

루트에 Next.js 라우트, 기능 코드, 공통 코드와 설정·문서·데이터베이스 운영 자산이 함께 있어 프로젝트 경계를 빠르게 파악하기 어려웠다. 기능 규모가 커지면서 애플리케이션 코드와 운영 자산을 시각적으로 분리할 필요가 생겼다.

## 결정

- `app`, `features`, `shared`, `proxy.ts`를 `src/` 아래에 둔다.
- `public`, `scripts`, `supabase`, `docs`, `e2e`와 모든 설정·환경 파일은 저장소 루트에 유지한다.
- TypeScript `@/*` 별칭은 `src/*`를 가리킨다.
- 아키텍처 경계 검사는 `src/app`, `src/features`, `src/shared`를 검사하되, 기존 VAC 규칙은 그대로 적용한다.

## 이유

- 실제 웹 애플리케이션 코드와 설정·문서·DB 운영 자산의 경계를 명확히 한다.
- `app`, `features`, `shared`를 같은 소스 루트로 묶어 탐색과 온보딩을 단순하게 만든다.
- Next.js App Router의 `src/app`과 `src/proxy.ts` 파일 규칙을 사용해 프레임워크 관례를 따른다.

## 포기한 대안

- `features`와 `shared`만 `src`로 이동: 라우트 코드가 루트에 남아 애플리케이션 코드가 두 곳으로 나뉜다.
- 현 구조 유지: 기능은 동작하지만 루트에서 운영 자산과 런타임 코드의 구분이 계속 약하다.

## 결과

- 새 애플리케이션 코드는 `src/app`, `src/features`, `src/shared` 또는 `src/proxy.ts`에 둔다.
- 루트 `app`과 `src/app`을 동시에 만들지 않는다. Next.js는 루트 `app`이 있으면 `src/app`을 사용하지 않는다.
