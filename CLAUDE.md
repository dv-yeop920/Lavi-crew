# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)에게 방향을 제공합니다.

이 저장소의 규칙 원본은 `AGENTS.md` 하나입니다. 아래 import로 그 내용을 그대로 불러오므로 실질적으로 이 파일과 AGENTS.md는 같은 내용을 갖습니다. **규칙을 바꾸거나 추가해야 하면 이 파일이 아니라 `AGENTS.md`를 수정한다.**

@AGENTS.md

## Claude Code 전용 보충 정보

위 AGENTS.md에는 없지만 Claude Code로 작업할 때 유용한 내용만 아래에 덧붙인다. 새로운 업무 규칙이나 아키텍처 규칙은 여기가 아니라 AGENTS.md에 추가한다.

### Vitest 단일 파일·단일 케이스 실행

```bash
npx vitest run features/schedule/lib/schedule-worker-option.test.ts
npx vitest run -t "테스트 이름 일부"
```

### Claude Code 전용 서브에이전트

`.claude/agents/*.md`에 이 저장소 전용 서브에이전트를 둔다.

- `code-quality-reviewer`: 코드 작성·수정 직후 자동으로 호출되는 읽기 전용 품질·가독성·베스트 프랙티스 리뷰어.
- `frontend-senior-developer`: 화면 설계, 컴포넌트 분리, 공통 컴포넌트(`shared/ui`) 설계, 성능(LCP·INP·CLS·네트워크 지연) 관점에서 실제로 구현까지 하는 프론트엔드 에이전트.
- `backend-senior-developer`: 아키텍처(VAC 경계, RLS·RPC 원자성)와 성능(응답 속도, 쿼리 효율, N+1, 캐시 전략) 관점에서 Action/Controller/Repository/Supabase를 실제로 구현까지 하는 백엔드 에이전트.
- `product-planner`: 비즈니스 가치, 사용자(고객·관리자) 중심 사고, 기술적 실현 가능성, 데이터 기반 판단 관점에서 기능·화면 요구사항을 설계하고 문서화하는 기획 에이전트. 코드는 수정하지 않는다.
- `qa-qc-tester`: 구현된 기능이 실제로 요구사항대로 동작하는지 Vitest·`test:db`·`test:e2e`를 직접 실행해 검증하는 QA/QC 에이전트. 구현 코드는 고치지 않고 재현 절차와 커버리지 갭만 보고한다.

### Claude Code 전용 스킬

`.claude/skills/*/SKILL.md`에 이 저장소 전용 스킬을 둔다. 서브에이전트와 달리 별도 컨텍스트로 위임하지 않고, 지금 작업 중인 에이전트가 직접 절차를 따르게 한다.

- `lavi-supabase-verify`: 로컬 Supabase를 기동해 `db:reset` → `test:db`(필요하면 `test:e2e`까지) 파이프라인을 올바른 순서·전제조건으로 실행하는 절차. 시나리오 설계나 신규 테스트 작성은 다루지 않는다(`qa-qc-tester`의 역할).

### 세션 간 지속 메모리

Claude Code는 대화 세션과 별도로 파일 기반 메모리(`~/.claude/projects/<project-id>/memory/`)를 유지한다. 이 메모리는 대화 컨텍스트가 아니라 파일 시스템에 저장되므로 세션 종료 후 재시작하거나 `/clear`로 대화를 초기화해도 사라지지 않는다.

- 저장소 작업을 시작할 때 관련 메모리가 있는지 먼저 확인하고, 세션 중 알게 된 비자명한 사용자 배경·피드백·진행 중인 작업 맥락·외부 참조 위치는 메모리에 기록해 다음 세션에서도 이어질 수 있게 한다.
- 코드·아키텍처·문서에서 파생 가능한 내용(파일 경로, 컨벤션, git 이력 등)은 메모리에 중복 저장하지 않는다. 이 저장소의 규칙 원본은 여전히 `AGENTS.md`이며, 메모리는 이를 대체하지 않는다.
- 메모리 디렉터리는 이 저장소 바깥에 있으므로 12장의 임시 파일 정리 규칙 대상이 아니다. 저장소 정리 작업 중에 실수로 삭제하거나 덮어쓰지 않는다.
