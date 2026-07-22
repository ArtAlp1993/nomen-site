// Юр-реквизиты для служебных страниц (Terms / Privacy / About / Contact).
// Единственный источник значений — data/legal.json (свод правил 4.3).
//
// Поля company / country / governingLaw заполняются по ходу оформления
// компании, поэтому страницы обязаны читаться связно и с пустыми полями:
// страну не выдумываем, но и «повисшей» запятой в тексте быть не должно.
import legal from "@/data/legal.json";

// «NOMEN, Thailand» — когда страна известна; просто «NOMEN» — пока нет.
export function operatorLine() {
  return [legal.company, legal.country].filter(Boolean).join(", ");
}

// Раздел Governing law: с конкретной юрисдикцией, либо нейтрально до неё.
export function governingLawText() {
  return legal.governingLaw
    ? `These Terms are governed by the laws of ${legal.governingLaw}.`
    : "These Terms are governed by the laws of the jurisdiction in which NOMEN is established.";
}
