export const web3config = {
  contractAddress: process.env.NEXT_PUBLIC_RISKON_ADDRESS,
  chainId: 50312,
  chainName: 'Somnia Testnet',
  chainRpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  chainExplorerUrl: 'https://shannon-explorer.somnia.network/',
} as const
