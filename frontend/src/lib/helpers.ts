const formatPriceDecimals = (price: number) => {
  return (price / 100000000).toFixed(2)
}

export { formatPriceDecimals }
