// 로그인 없는 따봉/비추를 위한 브라우저별 익명 식별자.
// localStorage 에 UUID 를 한 번 만들어 저장하고 재사용한다. 한 브라우저당 한 표를
// 유지하고 토글/전환을 가능하게 하는 용도이며, 신원 식별이 아니다.
// (localStorage 를 지우면 새 식별자가 발급된다 — 소규모 게시판에 충분한 수준.)

const KEY = 'jipyo:voter-id'

export function getVoterId(): string {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    // localStorage 불가(사생활 모드 등) — 세션 한정 임시 식별자
    return crypto.randomUUID()
  }
}
