const formatPriceDecimals = (price: number) => {
  return (price / 100000000).toFixed(2)
}

const formatUSDUnits = (
  value: bigint | string | number,
  usdDecimals = 8,
  fractionDigits = 2,
): string => {
  let big: bigint
  if (typeof value === 'bigint') big = value
  else if (typeof value === 'number') big = BigInt(Math.trunc(value))
  else big = BigInt(value)

  const base = 10n ** BigInt(usdDecimals)
  const whole = big / base
  const fraction = big % base

  const wholeStr = Number(whole).toLocaleString()
  const fractionStr = fraction
    .toString()
    .padStart(usdDecimals, '0')
    .slice(0, Math.max(0, fractionDigits))

  return fractionDigits > 0 ? `${wholeStr}.${fractionStr}` : wholeStr
}

export { formatPriceDecimals, formatUSDUnits }
