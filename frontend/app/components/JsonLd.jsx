// Вставляет разметку Schema.org в <script type="application/ld+json">.
// Серверный компонент: скрипт попадает в HTML сразу, краулеру не нужен JS.
//
// Экранируем '<' в < — иначе строка вида '</script>' внутри данных
// закрыла бы тег раньше времени и сломала страницу (классический XSS-вектор
// при inline-JSON).
export default function JsonLd({ data }) {
  const json = JSON.stringify(Array.isArray(data) && data.length === 1 ? data[0] : data)
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }}
    />
  )
}
