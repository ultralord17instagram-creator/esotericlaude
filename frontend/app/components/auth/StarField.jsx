// Декоративное звёздное поле для тёмных панелей входа/регистрации (Astrix).
// Один viewBox 600×820 масштабируется под любую панель через preserveAspectRatio
// "slice" + position:absolute из CSS. Цвета — золото акцента и кремовые звёзды.
export default function StarField({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 820"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <circle cx="90" cy="120" r="1.5" fill="#F3ECDB" opacity=".7" />
      <circle cx="200" cy="90" r="2" fill="#F3ECDB" opacity=".9" />
      <circle cx="470" cy="130" r="1.6" fill="#F3ECDB" opacity=".7" />
      <circle cx="520" cy="240" r="2" fill="#F3ECDB" opacity=".85" />
      <circle cx="70" cy="330" r="1.6" fill="#F3ECDB" opacity=".6" />
      <circle cx="140" cy="470" r="1.4" fill="#F3ECDB" opacity=".55" />
      <circle cx="500" cy="470" r="1.5" fill="#F3ECDB" opacity=".6" />
      <circle cx="430" cy="620" r="1.6" fill="#F3ECDB" opacity=".6" />
      <circle cx="120" cy="650" r="1.4" fill="#F3ECDB" opacity=".5" />
      <circle cx="300" cy="720" r="1.5" fill="#F3ECDB" opacity=".5" />
      <path d="M200 90 L300 170 L400 150 L470 130" fill="none" stroke="#B9954F" strokeWidth="1" opacity=".5" />
      <path d="M300 170 L340 270 L520 240" fill="none" stroke="#B9954F" strokeWidth="1" opacity=".4" />
      <circle cx="300" cy="170" r="3" fill="#B9954F" />
      <circle cx="400" cy="150" r="2.4" fill="#B9954F" />
      <circle cx="340" cy="270" r="2.6" fill="#B9954F" />
      <path
        d="M300 130 l1.6 6 6 1.6 -6 1.6 -1.6 6 -1.6 -6 -6 -1.6 6 -1.6 z"
        fill="#F3ECDB"
        opacity=".85"
      />
    </svg>
  )
}
