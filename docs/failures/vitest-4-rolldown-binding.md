# Vitest 4 선택 바인딩 누락

## 실패

Vitest 4.1.10을 npm으로 설치한 뒤 macOS arm64에서 테스트를 시작하면 `@rolldown/binding-darwin-arm64`를 찾지 못해 실행이 중단됐다.

## 원인

Vitest 4가 사용하는 Rolldown의 플랫폼별 선택 의존성이 현재 npm 설치 결과에 포함되지 않았다. 애플리케이션 코드나 테스트 코드의 실패는 아니었다.

## 현재 대안

- native Rolldown 시작 경로를 사용하지 않는 Vitest 3.2.7을 사용한다.
- 3.2.7은 같은 3 계열의 알려진 개발 서버 파일 노출 취약점이 수정된 버전이다.
- Vitest 4로 다시 올릴 때는 지원 Node 버전과 macOS·Linux CI의 선택 바인딩 설치를 함께 검증한다.
