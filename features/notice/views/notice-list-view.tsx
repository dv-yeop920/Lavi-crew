'use client'

import { useState } from 'react'

import { Button } from '@/shared/ui/button/button'
import { ContentCard } from '@/shared/ui/content-card/content-card'
import { PageHeader } from '@/shared/ui/page-header/page-header'
import { StatusBadge } from '@/shared/ui/status-badge/status-badge'
import { TextField } from '@/shared/ui/text-field/text-field'

import * as styles from './notice.css'
import * as layout from '@/shared/ui/layout/layout.css'

type Notice = {
  content: string
  date: string
  id: string
  isPinned: boolean
  readCount: number
  title: string
}

const initialNotices: Notice[] = [
  {
    content: '변경된 유니폼 착용 기준을 확인해 주세요.',
    date: '7월 14일',
    id: 'uniform',
    isPinned: true,
    readCount: 18,
    title: '7월 유니폼 착용 안내',
  },
  {
    content: '출근 시 직원 통로를 이용해 주세요.',
    date: '7월 10일',
    id: 'entrance',
    isPinned: false,
    readCount: 22,
    title: '직원 통로 이용 안내',
  },
  {
    content: '여름철 위생 수칙을 근무 전에 확인해 주세요.',
    date: '7월 3일',
    id: 'summer',
    isPinned: false,
    readCount: 24,
    title: '여름철 위생 수칙',
  },
]

type NoticeListViewProps = {
  isAdmin?: boolean
}

export function NoticeListView({ isAdmin = false }: NoticeListViewProps) {
  const [notices, setNotices] = useState(initialNotices)
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)

  function openCreateForm() {
    setEditingNoticeId(null)
    setTitle('')
    setContent('')
    setIsPinned(false)
    setIsFormOpen(true)
  }

  function openEditForm(notice: Notice) {
    setEditingNoticeId(notice.id)
    setTitle(notice.title)
    setContent(notice.content)
    setIsPinned(notice.isPinned)
    setIsFormOpen(true)
  }

  function saveNotice() {
    if (!title.trim() || !content.trim()) return

    if (editingNoticeId) {
      setNotices((current) =>
        current.map((notice) =>
          notice.id === editingNoticeId ? { ...notice, content, isPinned, title } : notice,
        ),
      )
    } else {
      setNotices((current) => [
        {
          content,
          date: '오늘',
          id: `notice-${current.length + 1}`,
          isPinned,
          readCount: 0,
          title,
        },
        ...current,
      ])
    }

    setIsFormOpen(false)
  }

  function deleteNotice(noticeId: string) {
    setNotices((current) => current.filter((notice) => notice.id !== noticeId))
  }

  return (
    <div className={layout.page}>
      <PageHeader
        backHref={isAdmin ? '/admin/more' : undefined}
        backLabel="관리로 돌아가기"
        eyebrow={isAdmin ? '공지 관리' : '공지'}
        title={isAdmin ? '공지와 읽음 현황' : '꼭 확인해 주세요'}
        description={
          isAdmin
            ? '공지 등록·수정·삭제·고정과 알바별 읽음 상태를 관리합니다.'
            : '고정된 공지가 먼저 표시됩니다.'
        }
      />
      {isAdmin ? <Button onClick={openCreateForm}>새 공지 등록</Button> : null}

      {isAdmin && isFormOpen ? (
        <ContentCard>
          <div className={styles.form}>
            <strong>{editingNoticeId ? '공지 수정' : '새 공지 등록'}</strong>
            <TextField
              label="제목"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <label className={styles.field}>
              <span className={styles.label}>내용</span>
              <textarea
                className={styles.textarea}
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </label>
            <label className={styles.checkbox}>
              <input
                checked={isPinned}
                type="checkbox"
                onChange={(event) => setIsPinned(event.target.checked)}
              />
              중요 공지로 고정
            </label>
            <div className={layout.wrap}>
              <Button disabled={!title.trim() || !content.trim()} onClick={saveNotice}>
                {editingNoticeId ? '수정 저장' : '공지 등록'}
              </Button>
              <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                취소
              </Button>
            </div>
          </div>
        </ContentCard>
      ) : null}

      {notices.length > 0 ? (
        <ul className={layout.list}>
          {notices.map((notice) => (
            <li key={notice.id}>
              <ContentCard>
                <div className={layout.row}>
                  <strong>{notice.title}</strong>
                  {notice.isPinned ? <StatusBadge tone="warning">고정</StatusBadge> : null}
                </div>
                <p>{notice.date}</p>
                <p>{notice.content}</p>
                {isAdmin ? (
                  <div className={layout.wrap}>
                    <StatusBadge tone="neutral">읽음 {notice.readCount} / 24명</StatusBadge>
                    <Button variant="secondary" onClick={() => openEditForm(notice)}>
                      수정
                    </Button>
                    <Button variant="secondary" onClick={() => deleteNotice(notice.id)}>
                      삭제
                    </Button>
                  </div>
                ) : (
                  <StatusBadge tone="positive">읽음</StatusBadge>
                )}
              </ContentCard>
            </li>
          ))}
        </ul>
      ) : (
        <ContentCard>
          <p className={styles.empty}>등록된 공지가 없습니다.</p>
        </ContentCard>
      )}
    </div>
  )
}
