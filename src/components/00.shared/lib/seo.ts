export interface RouteSeo {
  title?: string
  description?: string
}

const SITE_NAME = 'RealTimeMap'
const DEFAULT_TITLE = 'RealTimeMap — карта мест, метки и маршруты рядом с вами'
const DEFAULT_DESCRIPTION
  = 'RealTimeMap — интерактивная карта мест: смотрите метки людей вокруг, стройте маршруты и делитесь своими местами.'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function applyRouteSeo(seo?: RouteSeo) {
  const title = seo?.title ? `${seo.title} — ${SITE_NAME}` : DEFAULT_TITLE
  const description = seo?.description ?? DEFAULT_DESCRIPTION

  document.title = title
  setMeta('meta[name="description"]', 'name', 'description', description)
  setMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
}
