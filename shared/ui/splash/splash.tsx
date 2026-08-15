import * as styles from './splash.css'

export function Splash() {
  return (
    <div className={styles.viewport} role="status" aria-label="로딩 중">
      <div className={styles.content}>
        <svg
          className={styles.icon}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="32" height="32" rx="8" fill="currentColor" />
          <text
            x="16"
            y="23"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontSize="20"
            fontWeight="700"
            fill="white"
          >
            L
          </text>
        </svg>
        <div className={styles.text}>
          <span className={styles.char.first}>라</span>
          <span className={styles.char.second}>비</span>
        </div>
      </div>
    </div>
  )
}
