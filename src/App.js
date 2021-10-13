import './styles/App.css'
// import twitterLogo from './assets/twitter-logo.svg'
import React, { useState, useEffect } from "react"
import { ethers } from 'ethers'
import myNFT from './MyNFT.json'

// Constants
// const TWITTER_HANDLE = '_buildspace'
// const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`
const CONTRACT_ADDRESS = '0x8EEB251EdE1E98C9d99Bc32E2F27F5A635347eA3'
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/cheesenft-v3'
// const TOTAL_MINT_COUNT = 50

const metamaskFunction = (fn) => (...args) => {
  if (!window.ethereum) return alert('Get MetaMask!')
  return fn(...args)
}

const checkIfWalletIsConnect = metamaskFunction(async (setCurrentAccount) => {
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })

  if (accounts.length === 0) return console.log('No authorized account found')

  /**
   * User can have multiple authorized accounts, we grab the first one if its there!
   */
  const account = accounts[0]
  console.log('Found an authorized account:', account)
  setupEventListener()
  setCurrentAccount(account)
})

const getTotalNFTsMintedSoFar = metamaskFunction(async (setTotalMinted) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myNFT.abi, signer)

    const totalSoFar = await connectedContract.getTotalNFTsMintedSoFar()
    setTotalMinted(totalSoFar.toString())
  } catch (err) {
    console.error(err)
  }
})

const connectWallet = metamaskFunction(async (setCurrentAccount) => {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (accounts.length === 0) return alert('no accounts connected')

    console.log('Connected', accounts[0])
    setupEventListener()
    setCurrentAccount(accounts[0])
  } catch (err) {
    console.error(err)
  }
})

const askContractToMintNft = metamaskFunction(async (setIsMinting) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myNFT.abi, signer)

    console.log('Going to pop wallet now to pay gas...')
    let nftTxn = await connectedContract.makeAnEpicNFT()
    setIsMinting(true)

    console.log('Minting...please wait.')
    await nftTxn.wait()

    console.log(`Minted, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`)
    setIsMinting(false)
  } catch (error) {
    setIsMinting(false)

    console.log(error)
  }
})

const setupEventListener = metamaskFunction(async () => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myNFT.abi, signer)

    connectedContract.on('NewEpicNFTMinted', (from, tokenId) => {
      console.log(from, tokenId.toNumber())
      alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
    })

    console.log('Setup event listener!')
  } catch (error) {
    console.log(error)
  }
})

const getChainId = metamaskFunction(async (setChainId) => {
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    setChainId(chainId)
  } catch (error) {
    console.log(error)
  }
})

const App = () => {
  const [currentAccount, setCurrentAccount] = useState('')
  const [totalMinted, setTotalMinted] = useState(null)
  const [loadingChainId, setLoadingChainId] = useState(true)
  const [chainId, setChainId] = useState(null)
  const [isMinting, setIsMinting] = useState(false)

  useEffect(() => { checkIfWalletIsConnect(setCurrentAccount) }, [])
  useEffect(() => { getTotalNFTsMintedSoFar(setTotalMinted) }, [])
  useEffect(() => {
    const doAsyncEffect = async () => {
      await getChainId(setChainId)
      setLoadingChainId(false)
    }

    doAsyncEffect()
  }, [])

  // Render Methods
  return (
    <div className="App">
      <div className="container">
        {loadingChainId && (
        <div className='header-container'>
          <p className="header gradient-text">
            Figuring out which network we're on ...
          </p>
        </div>
        )}

        {!loadingChainId && chainId !== '0x4' && (
        <div className='header-container'>
          <p className="header gradient-text">
            Uh oh ... it looks like
          </p>
          <p className="header gradient-text">
            you're on the wrong network.
          </p>
          <p className="sub-text">
            Switch to the Rinkeby network in metamask, and then try reloading this page.
          </p>
        </div>
        )}

        {!loadingChainId && chainId === '0x4' && (
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          <p className="sub-text">
            {totalMinted === null ? '?' : totalMinted}/50 minted so far.
          </p>

          {currentAccount === ''
            ? <button
                className="cta-button connect-wallet-button"
                onClick={() => connectWallet(setCurrentAccount)}>
                Connect to Wallet
              </button>
            : <button
                onClick={async () => {
                  await askContractToMintNft(setIsMinting)
                  await getTotalNFTsMintedSoFar(setTotalMinted)
                }}
                className="cta-button connect-wallet-button">
                Mint NFT
              </button>
          }

          {isMinting && (
          <div
            style={{
              marginTop: '4rem',
              color: 'white',
              fontSize: '2rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <div>Minting ...</div>
            <div className="lds-circle"><div></div></div>
          </div>
          )}
        </div>)}
        <div className="footer-container">
          <a
            className="footer-text"
            href={OPENSEA_LINK}
            target="_blank"
            rel="noreferrer">
            View collection on opensea
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
