import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import myEpicNft from './utils/MyEpicNFT.json';

// Constants
const TWITTER_HANDLE = 'cassandrawilcox';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0x55A1fbD528382046852E4BA76333C62C1BC07fF2";
const OPENSEA_LINK = 'https://testnets.opensea.io/assets/';
const TOTAL_MINT_COUNT = 50;

const App = () => {
  /*
   * Just a state variable we use to store our user's public wallet. Don't forget to import useState.
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [tokenID, setTokenID] = useState(null);
  const [isMining, setIsMining] = useState("");
  const [totalMints, setTotalMints] = useState("");
  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkIfRinkebyChain = async () => {
    //make sure we have access to window.ethereum
    const { ethereum } = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4";
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!");
    }
  };

  const checkIfWalletIsConnected = async () => {
    //make sure we have access to window.ethereum
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      checkIfRinkebyChain();
    }
    // we can has access?
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    // grab the first account if its there
    if (accounts.length !== 0) {
      const account = accounts[0];
      setCurrentAccount(account);
      console.log('wallet account',account);
      // Setup listener! This is for the case where a user comes to our site
      // and ALREADY had their wallet connected + authorized.
      setupEventListener();
    } else {
      console.log("No authorized account found")
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      // request account access
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      setupEventListener();
    } catch (error) {
      console.log(error)
    }
  };
  // Setup our listener.

  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
        const totalMints = await connectedContract.getTotalNFTsMintedSoFar();
        setTotalMints(totalMints.toNumber());
        // "capture" mint event when the contract throws it
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          setTokenID(tokenId.toNumber());
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        let nftTxn = await connectedContract.makeAnEpicNFT();
        setIsMining(true);
        await nftTxn.wait();
        setIsMining(false);
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`, nftTxn);
        const totalMints = await connectedContract.getTotalNFTsMintedSoFar();
        setTotalMints(totalMints.toNumber());

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  };

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      Connect to Wallet
    </button>
  );

  const renderOpenSeaLinkContainer = () => {
    console.log('render link!', CONTRACT_ADDRESS, tokenID);
    const openSeaLink = OPENSEA_LINK+CONTRACT_ADDRESS+'/'+tokenID;
    return (
      <p><a className="nft-link" href={openSeaLink} target="_blank" rel="noreferrer">{openSeaLink}</a></p>
    )
  };

  const renderMintButton = () => {
    const mintButton = (
      <button onClick={askContractToMintNft} className="cta-button connect-wallet-button" disabled={isMining}>
             Mint NFT
      </button>
    );
    const miningMessage = (
      <p className="nft-link">Mining...please wait.</p>
    );
    return !isMining ? mintButton : miningMessage;
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">✨ Magic NFTs ✨</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          <p className="nft-link">{totalMints}/{TOTAL_MINT_COUNT} Available NFTs Minted | <a href="https://testnets.opensea.io/collection/cassnft-g0bbqivlbu" target="_blank" rel="noreferrer" className="nft-link">View Collection</a></p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : (
            renderMintButton()
          )}
          {tokenID && renderOpenSeaLinkContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
