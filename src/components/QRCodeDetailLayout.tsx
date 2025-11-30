export function QRCodeDetailLayout({
  leftContent,
  rightContent,
}: {
  leftContent: React.ReactNode
  rightContent: React.ReactNode
}) {
  return (
    <div className="grid md:grid-cols-[2fr_1fr] gap-4">
      <div className="">{leftContent}</div>
      <div className="">{rightContent}</div>
    </div>
  )
}
