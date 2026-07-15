import * as styles from './page.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.content}>
        <p className={styles.eyebrow}>LAVIEBEL CREW</p>
        <h1 className={styles.title}>라비크루</h1>
        <p className={styles.description}>
          라비에벨 웨딩홀 크루의 스케줄과 급여를 한곳에서 관리합니다.
        </p>
      </section>
    </main>
  )
}
