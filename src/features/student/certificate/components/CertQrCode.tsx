import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

/**
 * 외부 검증 URL QR — 이력서·명함에 인쇄해 쓰는 물건이라 실제로 스캔되어야 한다.
 *
 * <p>화면에는 SVG 한 벌만 그리고, PNG 는 그 SVG 를 캔버스에 올려 뽑는다.
 * 캔버스를 따로 렌더하면 같은 코드를 두 번 그리게 되고, 인쇄 품질도 SVG 쪽이 낫다.</p>
 */
export function useCertQrDownload(url: string, fileBase = 'playdata-certificate-qr') {
  const ref = useRef<SVGSVGElement>(null)

  const svgMarkup = () => {
    const el = ref.current
    if (!el) return null
    const clone = el.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    return new XMLSerializer().serializeToString(clone)
  }

  const save = (href: string, ext: string) => {
    const a = document.createElement('a')
    a.href = href
    a.download = `${fileBase}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const downloadSvg = () => {
    const markup = svgMarkup()
    if (!markup) return false
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    save(href, 'svg')
    // 클릭이 처리될 시간을 준 뒤 회수한다 — 즉시 revoke 하면 저장이 취소되는 브라우저가 있다.
    setTimeout(() => URL.revokeObjectURL(href), 1000)
    return true
  }

  /** 인쇄용이라 화면 크기가 아니라 넉넉한 고정 해상도로 뽑는다. */
  const downloadPng = (size = 1024) => {
    const markup = svgMarkup()
    if (!markup) return false
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      save(canvas.toDataURL('image/png'), 'png')
    }
    img.src = src
    return true
  }

  const node = (
    <QRCodeSVG
      ref={ref}
      value={url || 'https://playdata.io'}
      size={140}
      level="M"
      marginSize={2}
      bgColor="#FFFFFF"
      fgColor="#121726"
      className="size-[140px] shrink-0 rounded-lg"
    />
  )

  return { node, downloadPng, downloadSvg }
}
