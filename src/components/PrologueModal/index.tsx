import { type FormEvent, useState } from 'react'
import './PrologueModal.css'

type PrologueModalProps = {
  onCreateProfile: (nickname: string) => void
}

export default function PrologueModal({ onCreateProfile }: PrologueModalProps) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const submitPrologue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedNickname = nickname.trim()
    if (trimmedNickname.length < 2) {
      setError('닉네임은 2글자 이상으로 입력해 주세요.')
      return
    }

    onCreateProfile(trimmedNickname.slice(0, 12))
    setNickname('')
    setError('')
  }

  return (
    <>
      <div className="prologue-overlay" />
      <form className="prologue-modal" onSubmit={submitPrologue}>
        <div className="prologue-visual">
          <img src="/charcter/진입_아이콘.png" alt="" />
        </div>
        <div className="prologue-kicker">투자 한입에 오신 걸 환영해요</div>
        <h1 className="prologue-title">먼저 사용할 닉네임을 만들어 주세요</h1>
        <p className="prologue-copy">
          입력한 이름으로 개인 계정을 만들고, 바로 짧은 가이드 투어를 시작할게요.
        </p>
        <label className="prologue-label" htmlFor="prologue-nickname">닉네임</label>
        <input
          id="prologue-nickname"
          className="prologue-input"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value)
            if (error) setError('')
          }}
          autoFocus
          maxLength={12}
          placeholder="예: 지윤"
          aria-invalid={Boolean(error)}
        />
        {error && <div className="prologue-error">{error}</div>}
        <button className="btn-primary prologue-submit" type="submit">계정 만들고 시작하기</button>
      </form>
    </>
  )
}
