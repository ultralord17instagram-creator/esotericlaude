import styles from './legal.module.css'

// Общий каркас юридических страниц (/terms, /offer, /privacy, /info).
//
// intro: строка или массив строк (абзацы преамбулы).
// sections: [{ title, numbering, items: [ 'текст' | { text, list: [] } ] }]
//   Нумерация пунктов считается от индексов: раздел N, пункт N.M. Поэтому
//   порядок в массиве и есть нумерация — вставили пункт в середину, всё ниже
//   перенумеровалось само.
//   numbering: 'section' (по умолчанию) — раздел N, пункты N.M
//   numbering: 'flat'    — раздел без номера, пункты 1..N (вложенный документ,
//                          например форма согласия внутри политики)
//   numbering: 'none'    — ни раздел, ни пункты не нумеруются (термины,
//                          заключительные положения)
//   Ненумерованные разделы не сбивают счёт: номера идут только по 'section'.
//   lead — ненумерованный абзац сразу под заголовком раздела, до пунктов.
// clauses: плоский нумерованный список 1..N без заголовков разделов. Для
//   коротких документов, где деление на разделы только мешает. Формат элемента
//   тот же, что у section.items.
// requisites: [[label, value]] — необязательный блок реквизитов в конце.
export default function LegalDoc({ title, revision, intro, clauses, sections = [], requisites, requisitesTitle = 'Реквизиты' }) {
  const paragraphs = Array.isArray(intro) ? intro : intro ? [intro] : []

  let counter = 0
  const numbered = sections.map((section) => {
    const mode = section.numbering || 'section'
    if (mode === 'section') counter += 1
    return { section, mode, no: mode === 'section' ? counter : null }
  })

  return (
    <main className={styles.page}>
      <article className={styles.doc}>
        <header className={styles.head}>
          <h1 className={styles.h1}>{title}</h1>
          {revision && <p className={styles.revision}>Редакция от {revision}</p>}
          {paragraphs.map((text) => <p key={text} className={styles.intro}>{text}</p>)}
        </header>

        {clauses && (
          <section className={styles.section}>
            {clauses.map((raw, i) => {
              const item = typeof raw === 'string' ? { text: raw } : raw
              return (
                <div key={i} className={styles.clause}>
                  <p className={styles.p}>
                    <span className={styles.num}>{i + 1}.</span>
                    {item.text}
                  </p>
                  {item.list && (
                    <ul className={styles.list}>
                      {item.list.map((li) => <li key={li}>{li}</li>)}
                    </ul>
                  )}
                </div>
              )
            })}
          </section>
        )}

        {numbered.map(({ section, mode, no }) => (
          <section key={section.title} className={styles.section}>
            <h2 className={styles.h2}>
              {no && <span className={styles.secNum}>{no}.</span>}
              {section.title}
            </h2>

            {section.lead && <p className={styles.lead}>{section.lead}</p>}

            {section.items.map((raw, ii) => {
              const item = typeof raw === 'string' ? { text: raw } : raw
              const label = mode === 'section' ? `${no}.${ii + 1}.` : mode === 'flat' ? `${ii + 1}.` : null
              return (
                <div key={ii} className={styles.clause}>
                  <p className={styles.p}>
                    {label && <span className={styles.num}>{label}</span>}
                    {item.text}
                  </p>
                  {item.list && (
                    <ul className={styles.list}>
                      {item.list.map((li) => <li key={li}>{li}</li>)}
                    </ul>
                  )}
                </div>
              )
            })}
          </section>
        ))}

        {requisites && (
          <section className={styles.section}>
            <h2 className={styles.h2}>{requisitesTitle}</h2>
            <dl className={styles.requisites}>
              {requisites.map(([label, value]) => (
                <div key={label} className={styles.reqRow}>
                  <dt className={styles.reqLabel}>{label}</dt>
                  <dd className={styles.reqValue}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </article>
    </main>
  )
}
